<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Inicio')</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="path/to/font-awesome/css/font-awesome.min.css">
    @vite('resources/css/app.css')
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    @include('layouts.header')

    <main class="container mx-auto py-8">
        @yield('content')
    </main>

    @include('layouts.footer')
</body>
</html>
