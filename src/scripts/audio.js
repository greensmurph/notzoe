import { Howl, Howler } from 'howler';

export class AudioPlayer {
  constructor(carousel) {
    this.carousel = carousel;
    this.audioTracks = [];
    this.currentTrack = null;
    this.isPlaying = false;
    this.isLowMemoryDevice = this.checkIfLowMemoryDevice();
    
    // Initialize audio tracks
    this.initAudioTracks();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Check if device might be memory-constrained
  checkIfLowMemoryDevice() {
    return navigator.deviceMemory && navigator.deviceMemory <= 4; // 4GB or less RAM
  }
  
  // Initialize audio tracks array
  initAudioTracks() {
    const totalCards = this.carousel.getTotalCards();
    
    for (let i = 0; i < totalCards; i++) {
      const card = this.carousel.getCardByIndex(i);
      this.audioTracks.push({
        id: i, // Use the index as the ID to match with carousel's currentIndex
        src: card.audio,
        name: card.name,
        artist: card.artist,
        howl: null
      });
    }
  }
  
  // Set up event listeners
  setupEventListeners() {
    const playPauseBtn = document.querySelector('.play-pause-btn');
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeIcon = document.querySelector('.volume-control .volume-icon');
    
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        this.togglePlayPause();
      });
    }
    
    if (volumeSlider) {
      // Set initial volume
      this.volume = volumeSlider.value / 100;
      Howler.volume(this.volume);
      
      // Add event listener for volume change
      volumeSlider.addEventListener('input', (e) => {
        this.volume = e.target.value / 100;
        Howler.volume(this.volume);
        // Update the slider value
        volumeSlider.value = this.volume * 100;
        
        // Update muted state based on volume
        if (this.volume === 0 && volumeIcon) {
          volumeIcon.classList.add('muted');
          volumeSlider.classList.add('muted');
        } else if (volumeIcon) {
          volumeIcon.classList.remove('muted');
          volumeSlider.classList.remove('muted');
        }
        
      });
    }
    
    // Add click event listener to volume icon for toggling mute
    if (volumeIcon) {
      volumeIcon.addEventListener('click', () => {
        if (volumeSlider) {
          // If volume is 0, set it to 40%, otherwise set it to 0
          if (this.volume === 0) {
            this.volume = 0.4; // 40%
            // Remove muted class if it exists
            volumeIcon.classList.remove('muted');
            // Update slider appearance
            volumeSlider.classList.remove('muted');
          } else {
            this.volume = 0;
            // Add muted class for styling
            volumeIcon.classList.add('muted');
            // Update slider appearance
            volumeSlider.classList.add('muted');
          }
          
          // Update Howler volume
          Howler.volume(this.volume);
          
          // Update the slider value
          volumeSlider.value = this.volume * 100;
          
        }
      });
    }
    
    // Preload audio tracks after page load
    window.addEventListener('load', () => {
      // Wait 3 seconds after page load before starting to preload audio
      setTimeout(() => {
        this.preloadAudioForCurrentSlide();
      }, 3000);
    });
  }
  
  // Toggle play/pause
  togglePlayPause() {
    if (!this.currentTrack) {
      // If no track is currently selected, play the current slide's track
      this.playTrack(this.carousel.currentIndex);
    } else {
      // Toggle play/pause for the current track
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }
  }
  
  // Play the current track
  play() {
    if (this.currentTrack && this.currentTrack.howl) {
      this.currentTrack.howl.play();
      this.isPlaying = true;
      this.updatePlayPauseButton(true);
    }
  }
  
  // Pause the current track
  pause() {
    if (this.currentTrack && this.currentTrack.howl) {
      this.currentTrack.howl.pause();
      this.isPlaying = false;
      this.updatePlayPauseButton(false);
    }
  }
  
  // Stop the current track
  stop() {
    if (this.currentTrack && this.currentTrack.howl) {
      this.currentTrack.howl.stop();
      this.isPlaying = false;
      this.updatePlayPauseButton(false);
    }
  }
  
  // Play a specific track by index
  playTrack(index) {
    // Stop current track if playing
    this.stop();
    
    // Get the track for the specified index
    const track = this.audioTracks[index];
    this.currentTrack = track;
    
    // Initialize the Howl object if it doesn't exist
    if (!track.howl) {
      track.howl = this.createHowl(track);
    }
    
    // Play the track
    track.howl.play();
    this.isPlaying = true;
    this.updatePlayPauseButton(true);
    
    
    // Prefetch upcoming audio
    this.prefetchUpcomingAudio(index);
  }
  
  // Create a Howl object for a track
  createHowl(track) {
    return new Howl({
      src: [track.src],
      html5: true, // Use HTML5 Audio to stream without fully loading
      preload: false, // Don't preload immediately
      format: ['mp3'], // Explicitly specify format
      onend: () => {
        // When track ends, wait 1 second before moving to the next slide
        setTimeout(() => {
          this.carousel.nextSlide();
        }, 1000); // 1 second delay
      },
      onload: () => {
      },
      onloaderror: (id, error) => {
        console.error(`Error loading track ${track.name}:`, error);
      },
      onplayerror: (id, error) => {
        console.error(`Error playing track ${track.name}:`, error);
        
        // Try to recover by creating a new Howl instance
        track.howl.unload();
        track.howl = this.createHowl(track);
        
        // Try to play again after a short delay
        setTimeout(() => {
          track.howl.play();
        }, 250);
      }
    });
  }
  
  // Handle slide change event from carousel
  onSlideChange(index) {
    // Stop current audio
    this.stop();
    
    // Update current track reference
    this.currentTrack = this.audioTracks[index];
    
    // Prefetch audio for current and upcoming slides
    this.prefetchUpcomingAudio(index);
    
    // If we're in low memory mode, manage memory
    if (this.isLowMemoryDevice) {
      this.manageAudioMemory(index);
    }
  }
  
  // Prefetch audio for current and upcoming slides
  prefetchUpcomingAudio(currentIndex) {
    // Ensure current track is initialized
    this.initAudioTrack(currentIndex);
    
    // Define loading order based on proximity to current slide
    const loadingOrder = [];
    
    // Add next 3 tracks (wrapping around if needed)
    for (let i = 1; i <= 3; i++) {
      loadingOrder.push((currentIndex + i) % this.audioTracks.length);
    }
    
    // Add previous 2 tracks
    for (let i = 1; i <= 2; i++) {
      loadingOrder.push((currentIndex - i + this.audioTracks.length) % this.audioTracks.length);
    }
    
    // Load tracks in priority order with delays
    loadingOrder.forEach((index, priority) => {
      setTimeout(() => {
        const track = this.initAudioTrack(index);
        if (track.howl && !track.howl.state() && !track.howl.loading()) {
          track.howl.load();
        }
      }, priority * 300); // Stagger loading to prioritize nearest tracks
    });
  }
  
  // Initialize audio track and return it
  initAudioTrack(index) {
    const track = this.audioTracks[index];
    if (!track.howl) {
      track.howl = this.createHowl(track);
    }
    return track;
  }
  
  // Preload audio for current slide
  preloadAudioForCurrentSlide() {
    const currentIndex = this.carousel.currentIndex;
    this.initAudioTrack(currentIndex);
    
    // Start staggered loading of all tracks
    this.preloadAllTracksStaggered();
  }
  
  // Preload all tracks in a staggered manner
  preloadAllTracksStaggered() {
    this.audioTracks.forEach((track, index) => {
      // Stagger loading to not overwhelm bandwidth
      setTimeout(() => {
        if (!track.howl) {
          track.howl = this.createHowl(track);
        }
        
        // Only load if not already loading or loaded
        if (!track.howl.state() && !track.howl.loading()) {
          track.howl.load();
        }
      }, index * 1000); // Load one track per second
    });
  }
  
  // Manage memory for audio tracks (for low memory devices)
  manageAudioMemory(currentIndex) {
    this.audioTracks.forEach((track, index) => {
      // Calculate distance from current index (considering loop)
      const distance = Math.min(
        Math.abs(index - currentIndex),
        this.audioTracks.length - Math.abs(index - currentIndex)
      );
      
      // Only unload tracks that are very far away (more than 5 positions)
      // and not currently playing
      if (distance > 5 && track.howl && track.howl.state() !== 'playing') {
        track.howl.unload();
        track.howl = null;
      }
    });
  }
  
  // Update the play/pause button UI
  updatePlayPauseButton(isPlaying) {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    const playPauseBtn = document.querySelector('.play-pause-btn');
    
    if (playIcon && pauseIcon && playPauseBtn) {
      if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        playPauseBtn.setAttribute('aria-label', 'Pause');
      } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        playPauseBtn.setAttribute('aria-label', 'Play');
      }
    }
  }
}
