
import L from 'leaflet';

// Fix the missing icon issue
export const setupLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Custom avatar marker
export const createAvatarIcon = (avatarUrl: string | null) => {
  return L.divIcon({
    className: 'custom-avatar-marker',
    html: `<div class="avatar-container">
      <img src="${avatarUrl || 'https://ui-avatars.com/api/?name=User&background=random'}" 
      alt="User" class="avatar-image" />
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  });
};

// Create a custom icon for the correct location
export const createCorrectLocationIcon = () => {
  return L.divIcon({
    className: 'correct-marker-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Style the avatar marker via CSS
export const createMapStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .custom-avatar-marker {
      background: none;
      border: none;
    }
    
    .avatar-container {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    
    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .correct-marker-icon {
      background-color: #10b981;
      border: 2px solid white;
      width: 20px !important;
      height: 20px !important;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    
    .hint-circle {
      stroke-dasharray: 5, 5;
      stroke: #f59e0b;
      fill: #f59e0b;
      fill-opacity: 0.1;
    }
  `;
  document.head.appendChild(style);
};
