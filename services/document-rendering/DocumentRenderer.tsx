import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';

// Helper to wait for a moment (allows images/fonts to settle if needed, though we await html2canvas)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class DocumentRenderer {
    private static instance: DocumentRenderer;

    private constructor() {
        // Singleton
    }

    public static getInstance(): DocumentRenderer {
        if (!DocumentRenderer.instance) {
            DocumentRenderer.instance = new DocumentRenderer();
        }
        return DocumentRenderer.instance;
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
            // Create a transient container for this specific render job
            // Use z-index -9999 to hide behind canvas, avoiding opacity:0 issues with html2canvas
            const container = document.createElement('div');
            container.style.position = 'fixed'; // Fixed ensures it's relative to viewport
            container.style.top = '0';
            container.style.left = '0';
            container.style.zIndex = '-9999';
            // container.style.opacity = '0'; // REMOVED: potentially causes empty captures
            container.style.pointerEvents = 'none'; // Don't block clicks
            container.style.width = 'auto'; // allow natural expansion
            container.style.minWidth = '1024px'; // Force some width
            container.style.minHeight = '1024px'; // Force some height
            container.style.height = 'auto';
            container.style.display = 'flex';
            container.style.gap = '20px';
            container.style.backgroundColor = 'transparent'; // Ensure partial transparency works if needed
            document.body.appendChild(container);

            const textureUrls: string[] = [];

            try {
                const root = createRoot(container);

                // Render the component (which might contain multiple pages)
                root.render(component);

                // Wait for React to flush changes and assets to load
                // Increased wait time to 2000ms to allow fonts/images to settle
                await wait(2000);

                // Find pages
                let pages = Array.from(container.querySelectorAll('.document-page'));

                // Fallback: if no specific pages defined, treat the first child as the page
                if (pages.length === 0) {
                    // Check children again after wait
                    console.log("DocumentRenderer: No .document-page found. Checking container children count:", container.children.length);
                    if (container.children.length > 0) {
                        pages = Array.from(container.children);
                    }
                }

                if (pages.length === 0) {
                    console.error("DocumentRenderer: Still no content found to render after wait.");
                    // Log the container innerHTML to see what happened
                    console.log("Container Content:", container.innerHTML);
                    textureUrls.push('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='); // 1x1 white
                } else {
                    for (const page of pages) {
                        const element = page as HTMLElement;

                        // Temporary style enforcement for capture
                        const originalWidth = element.style.width;
                        const originalHeight = element.style.height;
                        element.style.width = `${width}px`;
                        element.style.height = `${height}px`;

                        const canvas = await html2canvas(element, {
                            scale: 2, // High res capture (2x)
                            useCORS: true,
                            logging: false, // Enable logging to debug
                            backgroundColor: null, // Transparent background if possible, or defined by CSS
                            width: width,
                            height: height,
                            onclone: (clonedDoc) => {
                                // Ensure fonts are visible in clone
                                const link = clonedDoc.createElement('link');
                                link.href = '/assets/index.css'; // Attempt to inject styles? Usually auto-picked up.
                                // Actually, clondedDoc uses current document styles usually.
                            }
                        });


                        // DEBUG: Visualize capture result on screen
                        // const debugCanvas = document.createElement('canvas'); ... // REMOVED for Prod

                        // Restore styles
                        element.style.width = originalWidth;
                        element.style.height = originalHeight;

                        textureUrls.push(canvas.toDataURL('image/png'));
                    }
                }

                // Cleanup
                root.unmount();
                document.body.removeChild(container);

                resolve(textureUrls);
            } catch (error) {
                console.error("Error rendering document to texture:", error);
                // Attempt cleanup
                try {
                    if (container.parentNode) document.body.removeChild(container);
                } catch (e) { /* ignore */ }
                reject(error);
            }
        });
    }
}
