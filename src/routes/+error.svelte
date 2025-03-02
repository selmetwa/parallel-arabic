<!-- /**
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <title>%sveltekit.error.message%</title>
</head>

<body>
  <style>
    body {
      background-color: hsl(0, 62%, 71%);
      font-family: 'Arial', sans-serif;
    }
    
    h1 {
      font-size: 2rem;
      font-weight: 600;
    }
    
    p {
      color: #1b1919;
      margin: 3px 0;
      padding: 0;
      font-size: 1.2rem;
    }
    
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    
    .error-message {
      color: #333;
    }
  </style>
  <div class="container">
    <h1 class="text-2xl font-bold">أنا آسف, Ana Asif, I'm sorry</h1>
    <p>It looks like something went wrong.</p>
    <p>Status: %sveltekit.status%</p>
    <p>Message: %sveltekit.error.message%</p>
    <p>
      Please send an angry email to <code>selmetwa@gmail.com</code>.
    </p>
    <a href="/">Go Home</a>
  </div>
</body>

</html>


*/ -->

<!-- please make my svelte component from the above html code -->



<script lang="ts">
  import { page } from '$app/stores';
</script>

<style>
  h1 {
    font-size: 2rem;
    font-weight: 600;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
  
  .error-message {
    color: #333;
  }
</style>

<div class="container">
  <h1 class="text-2xl font-bold">أنا آسف, Ana Asif, I'm sorry</h1>
  <p>It looks like something went wrong.</p>
  <p>Status: {$page.status}</p>
  <p>Message: {$page.error?.message}</p>
  <p>
    Please send an angry email to <code>selmetwa@gmail.com</code>
  </p>
  <a href="/" class="text-blue-500 underline">Go Home</a>
</div>