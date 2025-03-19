// Import dependencies
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/virtual';
import 'swiper/css/effect-creative';
import { Carousel } from './carousel.js';
import { AudioPlayer } from './audio.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the carousel
  const carousel = new Carousel();
  
  // Initialize the audio player
  const audioPlayer = new AudioPlayer(carousel);
  
  // Connect carousel and audio player
  carousel.setAudioPlayer(audioPlayer);
  
  // Initialize theme toggle functionality
  // initThemeToggle();
  
  // Initialize scroll handling
  initScrollHandling();
  
  // Don't auto-play audio - wait for user interaction
  // Update track info for the first slide
  carousel.updateTrackInfo();
});

// Theme toggle functionality
// function initThemeToggle() {
//   const themeToggle = document.getElementById('theme-toggle');
//   const body = document.body;
  
//   // Check for saved theme preference
//   const savedTheme = localStorage.getItem('theme');
//   if (savedTheme === 'light') {
//     body.classList.add('light-theme');
//   }
  
//   // Toggle theme when button is clicked
//   themeToggle.addEventListener('click', () => {
//     body.classList.toggle('light-theme');
    
//     // Save preference to localStorage
//     const currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
//     localStorage.setItem('theme', currentTheme);
//   });
// }

// Scroll handling
function initScrollHandling() {
  let lastScrollTop = 0;
  let isThrottled = false;
  const throttleDelay = 0;

  window.addEventListener('scroll', function() {
    if (isThrottled) return;

    isThrottled = true;

    setTimeout(() => {
      let currentScrollTop = window.scrollY;

      if (window.scrollY !== 0) {
        document.querySelector('header').classList.add('scrolling');
      } else {
        document.querySelector('header').classList.remove('scrolling');
      }

      lastScrollTop = currentScrollTop;
      isThrottled = false;
    }, throttleDelay);
  });
}
