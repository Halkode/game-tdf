<header class="bg-white dark:bg-gray-900 shadow">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="/" class="text-2xl font-bold text-gray-900 dark:text-white">Jogo</a>
        <nav class="space-x-4">
            <a href="/" class="text-gray-700 dark:text-gray-200 hover:underline">Início</a>
        </nav>
        <button id="dark-toggle" class="ml-4 p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hidden">
            🌙
        </button>
    </div>
</header>
<script>
    document.getElementById('dark-toggle').onclick = function() {
        document.documentElement.classList.toggle('dark');
        if(document.documentElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    };
    if(localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }
</script>
