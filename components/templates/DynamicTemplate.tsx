import React from 'react';

export interface DynamicElement {
  type: 'text' | 'field' | 'paragraph' | 'image' | 'line' | 'table';
  id?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;

  // Content
  text?: string;       // Static text
  key?: string;        // Data key for dynamic content
  label?: string;      // Label for fields (e.g. "Name: ")
  src?: string;        // For images (static)

  // Style
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DynamicLayoutSchema {
  elements: DynamicElement[];
  backgroundImage?: string;
}

export interface DynamicTemplateProps {
  schema: DynamicLayoutSchema;
  data: any; // Raw data object
}

export const DynamicTemplate: React.FC<DynamicTemplateProps> = ({ schema, data }) => {

  // Helper to extract value from data using dot notation or direct access
  const getValue = (key?: string, fallback: string = '') => {
    if (!key) return fallback;
    // Simple check
    if (data[key] !== undefined) return data[key];
    if (data.fields && data.fields[key] !== undefined) return data.fields[key];
    return fallback;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Background often handled by parent, but schema can define separate layers */}

      {schema.elements.map((el, idx) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${el.x}px`,
          top: `${el.y}px`,
          width: el.width ? `${el.width}px` : 'auto',
          fontSize: el.fontSize ? `${el.fontSize}px` : '12pt',
          fontFamily: el.fontFamily || 'Courier Prime, monospace',
          fontWeight: el.fontWeight || 'normal',
          color: el.color || 'black',
          textAlign: el.align || 'left',
          whiteSpace: 'pre-wrap'
        };

        switch (el.type) {
          case 'text':
            return (
              <div key={idx} style={style}>
                {el.text}
              </div>
            );

          case 'field':
            return (
              <div key={idx} style={style}>
                {el.label && <span style={{ fontWeight: 'bold' }}>{el.label} </span>}
                <span>{getValue(el.key, '{MISSING}')}</span>
              </div>
            );

          case 'paragraph':
            return (
              <div key={idx} style={style}>
                {getValue(el.key, el.text || '')}
              </div>
            );

          case 'line':
            return (
              <div key={idx} style={{
                ...style,
                height: el.height || '1px',
                width: el.width || '100%',
                backgroundColor: el.color || 'black'
              }} />
            );

          case 'image':
            // Can be static src or dynamic url from data
            const imgSrc = el.src || getValue(el.key);
            if (!imgSrc) return null;
            return (
              <img key={idx} src={imgSrc} style={{
                ...style,
                objectFit: 'contain'
              }} />
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
