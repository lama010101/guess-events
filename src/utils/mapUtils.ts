
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';

// Setup Leaflet icons
export const setupLeafletIcons = () => {
  // Delete is not type-safe here, use proper interface extension instead
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Create an avatar icon for the user's guess
export const createAvatarIcon = (avatarUrl: string | null) => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="absolute -top-8 -left-8 w-16 h-16 flex items-center justify-center">
          <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
            <img 
              src="${avatarUrl || '/placeholder.svg'}" 
              class="w-full h-full object-cover"
              onerror="this.src='/placeholder.svg'"
            />
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-6 bg-indigo-500"></div>
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Create an icon for the correct location
export const createCorrectLocationIcon = (customIcon?: React.ReactNode) => {
  const defaultHtml = `
    <div class="relative">
      <div class="absolute -top-10 -left-10 w-20 h-20 flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-white shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-6 bg-green-500"></div>
      </div>
    </div>
  `;
  
  // Use custom icon if provided
  const html = customIcon 
    ? `<div class="relative">
        <div class="absolute -top-10 -left-10 w-20 h-20 flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-white shadow-md">
            ${ReactDOMServer.renderToString(customIcon as any)}
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-6 bg-green-500"></div>
        </div>
      </div>`
    : defaultHtml;
  
  return L.divIcon({
    html,
    className: 'custom-div-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};
