
declare namespace JSX {
  interface IntrinsicElements {
    'gmp-map-3d': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      center?: string;
      heading?: string;
      tilt?: string;
      range?: string;
    };
    'gmp-polygon-3d': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'altitude-mode'?: string;
      'fill-color'?: string;
      'stroke-color'?: string;
      'stroke-width'?: string;
      extruded?: boolean;
    };
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        center?: string;
        heading?: string;
        tilt?: string;
        range?: string;
      };
      'gmp-polygon-3d': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'altitude-mode'?: string;
        'fill-color'?: string;
        'stroke-color'?: string;
        'stroke-width'?: string;
        extruded?: boolean;
      };
    }
  }
}