export function createSpaceDots() {
  // Remove existing dots first to prevent duplication
  const existingDots = document.querySelectorAll('.space-dot');
  existingDots.forEach(dot => dot.remove());

  const dotCount = 100;
  const body = document.body;
  
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('div');
    dot.classList.add('space-dot');
    
    // Random position
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 100}%`;
    
    // Random opacity
    dot.style.opacity = (Math.random() * 0.5 + 0.1).toString();
    
    // Random size (1-3px)
    const size = Math.random() * 2 + 1;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    
    body.appendChild(dot);
  }
}