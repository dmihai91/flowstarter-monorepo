// Import local fonts from Fontsource
import '@fontsource/inter/latin.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/montserrat/latin.css';
import '@fontsource/playfair-display/latin.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/open-sans/latin.css';
import '@fontsource/source-sans-3/latin.css';

// Export font configurations for CSS variables
export const inter = {
  variable: '--font-inter',
  style: { fontFamily: 'Inter, sans-serif' },
};

export const roboto = {
  variable: '--font-roboto',
  style: { fontFamily: 'Roboto, sans-serif' },
};

export const lato = {
  variable: '--font-lato',
  style: { fontFamily: 'Lato, sans-serif' },
};

export const montserrat = {
  variable: '--font-montserrat',
  style: { fontFamily: 'Montserrat, sans-serif' },
};

export const playfair = {
  variable: '--font-playfair',
  style: { fontFamily: 'Playfair Display, serif' },
};

export const poppins = {
  variable: '--font-poppins',
  style: { fontFamily: 'Poppins, sans-serif' },
};

export const openSans = {
  variable: '--font-open-sans',
  style: { fontFamily: 'Open Sans, sans-serif' },
};

export const sourceSansPro = {
  variable: '--font-source-sans',
  style: { fontFamily: 'Source Sans 3, sans-serif' },
};
