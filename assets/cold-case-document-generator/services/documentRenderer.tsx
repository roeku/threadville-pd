import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';

// Helper to wait for a moment (allows images/fonts to settle if needed, though we await html2canvas)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class DocumentRenderer {
  private container: HTMLDivElement;

  constructor() {
    // Create a hidden container for rendering
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '-10000px';
    this.container.style.left = '-10000px';
    // Ensure the container is large enough to hold the document without unintended wrapping constraints
    this.container.style.width = 'auto'; 
    this.container.style.height = 'auto';
    // Flex row to allow multiple pages to render side-by-side (hidden)
    this.container.style.display = 'flex';
    this.container.style.gap = '20px';
    document.body.appendChild(this.container);
  }

  /**
   * Renders a React component to a list of high-resolution data URLs (PNGs)
   */
  async renderToTextures(
    component: React.ReactNode,
    width: number = 816, // Standard 8.5" at 96 DPI (approx)
    height: number = 1056
  ): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const root = createRoot(this.container);
        
        // Wrap in a div that enforces specific dimensions for the capture
        // We use 2x dimensions for better texture quality (Retina-like)
        // Templates should use the class 'document-page' to mark page boundaries.
        // If no 'document-page' is found, we assume the whole wrapper is one page.

        const scale = 2;
        
        // Render the component (which might contain multiple pages)
        root.render(component);

        // Wait for React to flush changes
        await wait(300);

        // Find pages
        let pages = Array.from(this.container.querySelectorAll('.document-page'));
        
        // Fallback: if no specific pages defined, treat the first child as the page
        if (pages.length === 0 && this.container.firstChild) {
          pages = [this.container.firstChild as Element];
        }

        const textureUrls: string[] = [];

        for (const page of pages) {
            // Enforce dimensions on the element being captured if not already set by CSS
            // We clone the specific node dimensions or just force the standard size
            const element = page as HTMLElement;
            
            // Temporary style enforcement for capture
            const originalWidth = element.style.width;
            const originalHeight = element.style.height;
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;

            const canvas = await html2canvas(element, {
              scale: scale, // High res capture
              useCORS: true, // Allow cross-origin images if present
              logging: false,
              backgroundColor: '#ffffff', // Ensure opaque
              width: width,
              height: height,
            });

            // Restore styles (though we unmount shortly)
            element.style.width = originalWidth;
            element.style.height = originalHeight;

            textureUrls.push(canvas.toDataURL('image/png'));
        }
        
        // Cleanup
        root.unmount();
        this.container.innerHTML = '';

        resolve(textureUrls);
      } catch (error) {
        console.error("Error rendering document to texture:", error);
        reject(error);
      }
    });
  }
}

export const documentRenderer = new DocumentRenderer();