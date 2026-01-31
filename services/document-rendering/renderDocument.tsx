import React from 'react';
import { DocumentRenderer } from './DocumentRenderer';
import { TEMPLATE_REGISTRY } from './templateRegistry';
import { supabase } from '../supabase';
import { DynamicTemplate, DynamicLayoutSchema } from '../../components/templates/DynamicTemplate';

// Map EvidenceItem metadata to specific Template Data
// This is the bridge between our simplified game logic and the rich document generator
export async function renderDocumentToTexture(templateId: string, data: any): Promise<string[]> {
    console.log(`[RenderDocument] Starting render for template: ${templateId}`);
    try {
        console.log(`[RenderDocument] Data Keys Available: ${Object.keys(data).join(', ')}`);
        if (data.fields) {
            console.log(`[RenderDocument] 'fields' object found with keys: ${Object.keys(data.fields).join(', ')}`);
        }
    } catch (e) { }

    const renderer = DocumentRenderer.getInstance();
    let component: React.ReactNode;

    // Default dimensions
    let renderWidth = 816;
    let renderHeight = 1056;

    // Fix: The data passed in might be the raw metadata object which usually includes 'fields'.
    // We need to flatten it or correct the access if the caller passed the whole metadata object.
    const getValue = (key: string, fallback: any = '') => {
        // Direct access (e.g. data.caseNumber)
        if (data[key] !== undefined) return data[key];
        // Nested fields access (e.g. data.fields.caseNumber) if the caller passed unflattened data
        if (data.fields && data.fields[key] !== undefined) return data.fields[key];

        return fallback;
    };

    // Helper Use the injected content from EvidenceItem as a desperate fallback if structured fields are missing
    const getBodyFallback = () => data.content || data.description || "No content available.";
    const getTitleFallback = () => data.label || "Unknown Document";

    // 1. Registry Lookup (Hardcoded High-Fidelity Templates)
    const templateDef = TEMPLATE_REGISTRY[templateId];

    if (templateDef) {
        component = templateDef.render({ getValue, getBodyFallback, getTitleFallback });
        if (templateDef.width) renderWidth = templateDef.width;
        if (templateDef.height) renderHeight = templateDef.height;
    } else {
        // 2. Dynamic DB Lookup (Fallback to Supabase)
        console.log(`[RenderDocument] Template '${templateId}' not in registry. Checking Supabase...`);
        try {
            const { data: dbTemplate, error } = await supabase
                .from('document_templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (dbTemplate && !error) {
                console.log(`[RenderDocument] Found dynamic template for '${templateId}'`);
                const schema = dbTemplate.layout_schema as DynamicLayoutSchema;
                component = <DynamicTemplate schema={schema} data={data} />;
                if (dbTemplate.width) renderWidth = dbTemplate.width;
                if (dbTemplate.height) renderHeight = dbTemplate.height;
            } else {
                console.warn(`[RenderDocument] No template found in DB for '${templateId}'. Error: ${error?.message}`);
                throw new Error("Template not found");
            }
        } catch (err) {
            console.warn(`[RenderDocument] Falling back to generic letterhead for ${templateId}`);
            if (TEMPLATE_REGISTRY['letterhead-page']) {
                component = TEMPLATE_REGISTRY['letterhead-page'].render({ getValue, getBodyFallback, getTitleFallback });
            } else {
                return ['/textures/documents/paper_plain_1.png'];
            }
        }
    }

    // Render the component to texture(s)
    const textures = await renderer.renderToTextures(component, renderWidth, renderHeight);
    console.log(`[RenderDocument] Rendering complete. Generated ${textures.length} texture(s).`);
    return textures;
}