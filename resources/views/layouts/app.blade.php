<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Inicio')</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    @vite('resources/css/app.css')
    @vite('resources/js/app.jsx')
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    @include('layouts.header')

    <main class="container mx-auto py-8">
        @yield('content')
    </main>

    @include('layouts.footer')
</body>
</html>
