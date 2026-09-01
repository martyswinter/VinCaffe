<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


// ====================================
// CONFIG
// ====================================

require __DIR__ . '/config.php';

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';


header('Content-Type: application/json; charset=utf-8');


// ====================================
// POVOLIT POUZE POST
// ====================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Nepovolená metoda.'
    ]);

    exit;
}


// ====================================
// DATA Z FORMULÁŘE
// ====================================

$date =
    trim($_POST['date'] ?? '');

$time =
    trim($_POST['time'] ?? '');

$guests =
    trim($_POST['guests'] ?? '');

$note =
    trim($_POST['note'] ?? '');

$name =
    trim($_POST['name'] ?? '');

$email =
    trim($_POST['email'] ?? '');

$phone =
    trim($_POST['phone'] ?? '');

$recaptchaToken =
    trim($_POST['recaptcha_token'] ?? '');


// ====================================
// ZÁKLADNÍ VALIDACE
// ====================================

if (
    $date === '' ||
    $time === '' ||
    $guests === '' ||
    $name === '' ||
    $phone === ''
) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Chybí povinné údaje.'
    ]);

    exit;
}


// ====================================
// EMAIL - POKUD JE VYPLNĚN
// ====================================

if (
    $email !== '' &&
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Neplatný e-mail.'
    ]);

    exit;
}


// ====================================
// RECAPTCHA
// ====================================

if ($recaptchaToken === '') {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Chybí reCAPTCHA token.'
    ]);

    exit;
}


$recaptchaData =
    http_build_query([
        'secret' => $recaptchaSecret,
        'response' => $recaptchaToken
    ]);


$recaptchaContext =
    stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' =>
                "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $recaptchaData,
            'timeout' => 10
        ]
    ]);


$recaptchaResponse =
    file_get_contents(
        'https://www.google.com/recaptcha/api/siteverify',
        false,
        $recaptchaContext
    );


if ($recaptchaResponse === false) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Nepodařilo se ověřit reCAPTCHA.'
    ]);

    exit;
}


$recaptchaResult =
    json_decode(
        $recaptchaResponse,
        true
    );


if (
    empty($recaptchaResult['success']) ||
    ($recaptchaResult['score'] ?? 0) < 0.5 ||
    ($recaptchaResult['action'] ?? '') !== 'booking'
) {

    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' => 'reCAPTCHA ověření selhalo.'
    ]);

    exit;
}


// ====================================
// PŘEDMĚT PRO KAVÁRNU
// ====================================

$subject =
    'Rezervace: '
    . $date
    . ' / '
    . $time
    . ' / '
    . $name;


// ====================================
// TĚLO EMAILU PRO KAVÁRNU
// ====================================

$message =
    "Nová rezervace\n\n"
    . "Datum: " . $date . "\n"
    . "Čas: " . $time . "\n"
    . "Počet hostů: " . $guests . "\n\n"
    . "Jméno: " . $name . "\n"
    . "Telefon: " . $phone . "\n"
    . "E-mail: "
    . ($email !== '' ? $email : 'neuveden')
    . "\n\n"
    . "Poznámka:\n"
    . ($note !== '' ? $note : 'bez poznámky');


// ====================================
// FUNKCE PRO SMTP
// ====================================

function createMailer(
    $smtpHost,
    $smtpPort,
    $smtpUsername,
    $smtpPassword
) {

    $mail =
        new PHPMailer(true);

    $mail->isSMTP();

    $mail->Host =
        $smtpHost;

    $mail->SMTPAuth =
        true;

    $mail->Username =
        $smtpUsername;

    $mail->Password =
        $smtpPassword;

    $mail->SMTPSecure =
        PHPMailer::ENCRYPTION_STARTTLS;

    $mail->Port =
        $smtpPort;

    $mail->CharSet =
        'UTF-8';

    $mail->setFrom(
        $smtpUsername,
        'VinCaffé rezervace'
    );

    return $mail;
}


// ====================================
// EMAIL KAVÁRNĚ
// ====================================

try {

    $mail =
        createMailer(
            $smtpHost,
            $smtpPort,
            $smtpUsername,
            $smtpPassword
        );


    $mail->addAddress(
        $recipientEmail
    );


    if ($email !== '') {

        $mail->addReplyTo(
            $email,
            $name
        );

    }


    $mail->Subject =
        $subject;

    $mail->Body =
        $message;


    $mail->send();


} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Rezervaci se nepodařilo odeslat.'
    ]);

    exit;
}


// ====================================
// POTVRZENÍ ZÁKAZNÍKOVI
// pouze pokud vyplnil e-mail
// ====================================

if ($email !== '') {

    try {

        $confirmationMail =
            createMailer(
                $smtpHost,
                $smtpPort,
                $smtpUsername,
                $smtpPassword
            );


        $confirmationMail->addAddress(
            $email,
            $name
        );


        $confirmationMail->isHTML(true);


        $confirmationMail->Subject =
            'Rezervace VinCaffé – přijali jsme váš požadavek na rezervaci';


        $safeName =
            htmlspecialchars(
                $name,
                ENT_QUOTES,
                'UTF-8'
            );

        $safeDate =
            htmlspecialchars(
                $date,
                ENT_QUOTES,
                'UTF-8'
            );

        $safeTime =
            htmlspecialchars(
                $time,
                ENT_QUOTES,
                'UTF-8'
            );

        $safeGuests =
            htmlspecialchars(
                $guests,
                ENT_QUOTES,
                'UTF-8'
            );


        $confirmationMail->Body = '
<!DOCTYPE html>
<html lang="cs">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #ccd3ce;
    font-family: Arial, sans-serif;
    color: #272727;
">

    <div style="
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
    ">

        <div style="
            background-color: #f0f3ef;
            border-radius: 16px;
            overflow: hidden;
        ">

            <div style="
                padding: 32px;
                text-align: center;
                background-color: #cfe2ca;
            ">

                <h1 style="
                    margin: 0;
                    font-size: 28px;
                    color: #846B11;
                ">
                    VinCaffé rezervace
                </h1>

            </div>

            <div style="
                padding: 32px;
            ">

                <h2 style="
                    margin-top: 0;
                    color: #846B11;
                    font-size: 22px;
                ">
                    Požadavek na rezervaci jsme přijali
                </h2>

                <p style="
                    margin: 0 0 20px;
                    line-height: 1.6;
                ">
                    Dobrý den ' . $safeName . ',
                </p>

                <p style="
                    margin: 0 0 24px;
                    line-height: 1.6;
                ">
                    děkujeme za váš požadavek na rezervaci ve VinCaffé.
                    Teď se podíváme do rezervační knihy a následně se vám
                    ozveme s potvrzením.
                </p>

                <div style="
                    margin: 24px 0;
                    padding: 20px;
                    background-color: #cfe2ca;
                    border-radius: 12px;
                    line-height: 1.8;
                ">

                    <strong>Datum:</strong> ' . $safeDate . '<br>
                    <strong>Čas:</strong> ' . $safeTime . '<br>
                    <strong>Počet hostů:</strong> ' . $safeGuests . '<br>
                    <strong>Jméno:</strong> ' . $safeName . '

                </div>

                <p style="
                    margin: 8px 0 0;
                    font-weight: bold;
                ">
                    Váš tým VinCaffé
                </p>

                <p style="
                    margin: 24px 0 0;
                    font-size: 13px;
                    line-height: 1.5;
                    color: #6B7280;
                ">
                    Tento e-mail potvrzuje pouze přijetí požadavku.
                    Rezervace je platná až po našem potvrzení.
                    <br><br>
                    Kdybychom se vám neozvali do 24 hodin, kontaktujte nás prosím
                    na telefonním čísle +420 775 760 951.
                </p>

            </div>

        </div>

    </div>

</body>

</html>';


        // Textová záloha pro klienty,
        // které HTML e-maily nezobrazují

        $confirmationMail->AltBody =
            "Dobrý den " . $name . ",\n\n"
            . "děkujeme za váš požadavek na rezervaci ve VinCaffé.\n\n"
            . "Datum: " . $date . "\n"
            . "Čas: " . $time . "\n"
            . "Počet hostů: " . $guests . "\n"
            . "Jméno: " . $name . "\n\n"
            . "Teď se podíváme do rezervační knihy a následně se vám "
            . "ozveme s potvrzením.\n\n"
            . "Tento e-mail potvrzuje pouze přijetí požadavku. "
            . "Rezervace je platná až po našem potvrzení.\n\n"
            . "Kdybychom se vám neozvali do 24 hodin, kontaktujte nás prosím "
            . "na telefonním čísle +420 775 760 951.\n\n"
            . "Váš tým VinCaffé";


        $confirmationMail->send();


    } catch (Exception $e) {

        // Rezervace už do kavárny odešla.
        // Pokud selže jen potvrzení zákazníkovi,
        // rezervaci nepovažujeme za neúspěšnou.

        error_log(
            'Confirmation email failed: '
            . $e->getMessage()
        );

    }

}


// ====================================
// SUCCESS
// ====================================

echo json_encode([
    'success' => true
]);