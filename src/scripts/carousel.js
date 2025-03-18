import Swiper from 'swiper';
import { Navigation, Virtual, EffectCreative } from 'swiper/modules';

// Tarot card data
const tarotCards = [
  { id: 0, name: 'The Fool', artist: 'Tarot Concerto', image: 'images/cards/the-fool.jpg', audio: 'audio/01.mp3' },
  { id: 1, name: 'The Magician', artist: 'Tarot Concerto', image: 'images/cards/the-magician.jpg', audio: 'audio/02.mp3' },
  { id: 2, name: 'The High Priestess', artist: 'Tarot Concerto', image: 'images/cards/the-high-priestess.jpg', audio: 'audio/03.mp3' },
  { id: 3, name: 'The Empress', artist: 'Tarot Concerto', image: 'images/cards/the-empress.jpg', audio: 'audio/04.mp3' },
  { id: 4, name: 'The Emperor', artist: 'Tarot Concerto', image: 'images/cards/the-emperor.jpg', audio: 'audio/05.mp3' },
  { id: 5, name: 'The Hierophant', artist: 'Tarot Concerto', image: 'images/cards/the-hierophant.jpg', audio: 'audio/06.mp3' },
  { id: 6, name: 'The Lovers', artist: 'Tarot Concerto', image: 'images/cards/the-lovers.jpg', audio: 'audio/07.mp3' },
  { id: 7, name: 'The Chariot', artist: 'Tarot Concerto', image: 'images/cards/the-chariot.jpg', audio: 'audio/08.mp3' },
  { id: 8, name: 'Strength', artist: 'Tarot Concerto', image: 'images/cards/strength.jpg', audio: 'audio/09.mp3' },
  { id: 9, name: 'The Hermit', artist: 'Tarot Concerto', image: 'images/cards/the-hermit.jpg', audio: 'audio/10.mp3' }
];

export class Carousel {
  constructor() {
    this.audioPlayer = null;
    this.currentIndex = 0;
    this.isRapidNavigation = false;
    this.rapidNavigationTimer = null;
    
    this.initCarousel();
  }
  
  setAudioPlayer(audioPlayer) {
    this.audioPlayer = audioPlayer;
  }
  
  initCarousel() {
    // Create slides
    this.createSlides();
    
    // Initialize Swiper
    this.swiper = new Swiper('.swiper', {
      modules: [Navigation, Virtual, EffectCreative],
      loop: true,
      // Show centered slides with more visible adjacent slides
      slidesPerView: 1.5, // Show more of adjacent slides
      centeredSlides: true,
      spaceBetween: 10, // Reduce space between slides
      // Responsive breakpoints
      breakpoints: {
        // Mobile
        320: {
          slidesPerView: 1.5,
          spaceBetween: 10
        },
        // Tablet/Desktop
        480: {
          slidesPerView: 1.7, // Show even more on larger screens
          spaceBetween: 15
        }
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      // Enable lazy loading
      lazy: {
        loadPrevNext: true,
        loadPrevNextAmount: 2, // Preload 2 slides ahead/behind
        loadOnTransitionStart: true
      },
      on: {
        slideChange: () => this.handleSlideChange(),
        click: () => this.handleSlideClick(),
        setTranslate: () => {
          // Check if swiper and slides are defined
          if (this.swiper && this.swiper.slides && this.swiper.slides.length) {
            // Get all slides
            const slides = this.swiper.slides;
            const activeIndex = this.swiper.activeIndex;
            
            // Apply scale based on progress for each slide
            slides.forEach((slide, index) => {
              // Check if slide and progress are defined
              if (slide && typeof slide.progress !== 'undefined') {
                const progress = slide.progress;
                
                // Active slide scaling
                if (slide.classList.contains('swiper-slide-active')) {
                  // Scale down linearly as it's dragged away from center
                  const scale = 1 - Math.abs(progress) * 0.2;
                  slide.style.transform = `scale(${Math.max(0.8, scale)})`;
                }
                // Adjacent slides scaling
                else if (slide.classList.contains('swiper-slide-prev') || 
                         slide.classList.contains('swiper-slide-next')) {
                  // Scale up as they approach center
                  const scale = 0.8 + (1 - Math.abs(progress)) * 0.2;
                  slide.style.transform = `scale(${scale})`;
                }
                
                // Adjust opacity based on distance from center for all slides
                slide.style.opacity = 1 - Math.min(Math.abs(progress), 1) * 0.4;
              }
            });
          }
        },
        touchStart: () => {
          // Add dragging class when user starts dragging
          const container = document.querySelector('.swiper-container');
          if (container) {
            container.classList.add('swiper-container-dragging');
          }
        },
        touchEnd: () => {
          // Remove dragging class when user stops dragging
          const container = document.querySelector('.swiper-container');
          if (container) {
            container.classList.remove('swiper-container-dragging');
          }
        }
      }
    });
  }
  
  createSlides() {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    
    if (!swiperWrapper) {
      console.error('Swiper wrapper element not found!');
      return;
    }
    
    tarotCards.forEach(card => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      slide.setAttribute('data-card-id', card.id);
      
      // Create image with eager loading instead of lazy loading
      slide.innerHTML = `
        <img 
          src="${card.image}" 
          alt="${card.name}"
          width="300"
          height="500"
          onerror="console.error('Failed to load image:', this.src)"
        >
        <div class="swiper-lazy-preloader"></div>
      `;
      
      swiperWrapper.appendChild(slide);
    });
  }
  
  handleSlideChange() {
    // Clear existing timer
    clearTimeout(this.rapidNavigationTimer);
    
    // Mark as in rapid navigation mode
    this.isRapidNavigation = true;
    
    // Set timer to detect when rapid navigation ends
    this.rapidNavigationTimer = setTimeout(() => {
      this.isRapidNavigation = false;
      
      // Update current index
      this.currentIndex = this.swiper.realIndex;
      
      // Update track info in the UI
      this.updateTrackInfo();
      
      // If audio player exists, notify it of the slide change
      if (this.audioPlayer) {
        // Check if audio was playing before the slide change
        const wasPlaying = this.audioPlayer.isPlaying;
        
        // Notify of slide change (stops current audio)
        this.audioPlayer.onSlideChange(this.currentIndex);
        
        // Only auto-play the new track if audio was already playing
        if (wasPlaying) {
          this.audioPlayer.playTrack(this.currentIndex);
        }
      }
    }, 300); // Wait for navigation to settle
  }
  
  handleSlideClick() {
    // If we're in the middle of rapid navigation, ignore clicks
    if (this.isRapidNavigation) return;
    
    // Get current slide index
    this.currentIndex = this.swiper.realIndex;
    
    // Update track info
    this.updateTrackInfo();
    
    // If audio player exists, toggle play/pause for the current slide
    if (this.audioPlayer) {
      // Check if we're already on this slide and a track is playing
      if (this.audioPlayer.currentTrack && 
          this.audioPlayer.currentTrack.id === this.currentIndex) {
        // Toggle play/pause for the current track
        this.audioPlayer.togglePlayPause();
      } else {
        // If we're on a different slide, play the new track
        this.audioPlayer.playTrack(this.currentIndex);
      }
    }
  }
  
  updateTrackInfo() {
    const card = tarotCards[this.currentIndex];
    const trackTitleElement = document.querySelector('.track-title');
    const trackArtistElement = document.querySelector('.track-artist');
    
    if (trackTitleElement && trackArtistElement) {
      trackTitleElement.textContent = card.name;
      trackArtistElement.textContent = card.artist;
    }
  }
  
  // Method to programmatically go to the next slide
  nextSlide() {
    if (this.swiper) {
      this.swiper.slideNext();
    }
  }
  
  // Get the current card data
  getCurrentCard() {
    return tarotCards[this.currentIndex];
  }
  
  // Get card data by index
  getCardByIndex(index) {
    return tarotCards[index];
  }
  
  // Get total number of cards
  getTotalCards() {
    return tarotCards.length;
  }
}
