<?php

header('Content-Type: application/json; charset=utf-8');


// ====================================
// KONFIGURACE
// ====================================

$recaptchaSecret = '6LfGVo4tAAAAAKNcrQ_A7kVkd1KHCNHUOx2R2yNp';

$recipientEmail = 'info@vincaffe.cz';


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


$recaptchaUrl =
    'https://www.google.com/recaptcha/api/siteverify';


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
        $recaptchaUrl,
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
// PŘEDMĚT
// ====================================

$subject =
    'Rezervace: '
    . $date
    . ' / '
    . $time
    . ' / '
    . $name;


// ====================================
// TĚLO EMAILU
// ====================================

$message =
    "Nová rezervace\n\n"
    . "Datum: " . $date . "\n"
    . "Čas: " . $time . "\n"
    . "Počet hostů: " . $guests . "\n\n"
    . "Jméno: " . $name . "\n"
    . "Telefon: " . $phone . "\n"
    . "E-mail: " . ($email !== '' ? $email : 'neuveden') . "\n\n"
    . "Poznámka:\n"
    . ($note !== '' ? $note : 'bez poznámky');


// ====================================
// HEADERS
// ====================================

$headers = [];

$headers[] =
    'From: VinCaffe rezervace <info@vincaffe.cz>';

$headers[] =
    'Content-Type: text/plain; charset=UTF-8';

if ($email !== '') {

    $headers[] =
        'Reply-To: ' . $email;
}


// ====================================
// ODESLÁNÍ
// ====================================

$sent =
    mail(
        $recipientEmail,
        $subject,
        $message,
        implode("\r\n", $headers)
    );


if (!$sent) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'E-mail se nepodařilo odeslat.'
    ]);

    exit;
}


// ====================================
// SUCCESS
// ====================================

echo json_encode([
    'success' => true
]);