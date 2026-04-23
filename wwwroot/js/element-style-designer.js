/**
 * Element Style Designer
 * 
 * A comprehensive admin tool for designing custom CSS classes,
 * with live preview, two-way editing, state simulation, and persistence.
 */

// ============================================================================
// ELEMENT TYPE DEFINITIONS
// ============================================================================

const ELEMENT_TYPES = {
    button: {
        name: 'Button',
        html: (content) => `<button class="esd-preview-button" type="button">${content.text || 'Click me'}</button>`,
        contentFields: ['text'],
        defaultContent: { text: 'Click me' }
    },
    input: {
        name: 'Input',
        html: (content) => `<input class="esd-preview-input" type="text" placeholder="${content.placeholder || 'Enter text...'}" />`,
        contentFields: ['placeholder'],
        defaultContent: { placeholder: 'Enter text...' }
    },
    textarea: {
        name: 'Textarea',
        html: (content) => `<textarea class="esd-preview-textarea" placeholder="${content.placeholder || 'Enter text...'}">${content.text || ''}</textarea>`,
        contentFields: ['placeholder', 'text'],
        defaultContent: { placeholder: 'Enter text...', text: '' }
    },
    select: {
        name: 'Select',
        html: (content) => `<select class="esd-preview-select">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
        </select>`,
        contentFields: [],
        defaultContent: {}
    },
    checkbox: {
        name: 'Checkbox',
        html: (content) => `<label class="esd-preview-checkbox-label">
            <input type="checkbox" class="esd-preview-checkbox" />
            <span>${content.label || 'Checkbox label'}</span>
        </label>`,
        contentFields: ['label'],
        defaultContent: { label: 'Checkbox label' }
    },
    radio: {
        name: 'Radio',
        html: (content) => `<label class="esd-preview-radio-label">
            <input type="radio" name="esd-radio-demo" class="esd-preview-radio" />
            <span>${content.label || 'Radio label'}</span>
        </label>`,
        contentFields: ['label'],
        defaultContent: { label: 'Radio label' }
    },
    toggle: {
        name: 'Toggle / Switch',
        html: (content) => `<label class="esd-preview-toggle-label">
            <input type="checkbox" class="esd-preview-toggle" />
            <span class="esd-toggle-switch"></span>
        </label>`,
        contentFields: [],
        defaultContent: {}
    },
    card: {
        name: 'Card / Container',
        html: (content) => `<section class="esd-preview-card">
            <h3>${content.title || 'Card Title'}</h3>
            <p>${content.body || 'Card content goes here.'}</p>
        </section>`,
        contentFields: ['title', 'body'],
        defaultContent: { title: 'Card Title', body: 'Card content goes here.' }
    },
    section: {
        name: 'Section / Block',
        html: (content) => `<section class="esd-preview-section">
            <h3>${content.heading || 'Section Heading'}</h3>
            <p>${content.description || 'Section content description.'}</p>
        </section>`,
        contentFields: ['heading', 'description'],
        defaultContent: { heading: 'Section Heading', description: 'Section content description.' }
    },
    heading: {
        name: 'Heading',
        html: (content) => `<h3 class="esd-preview-heading">${content.text || 'Heading Text'}</h3>`,
        contentFields: ['text'],
        defaultContent: { text: 'Heading Text' }
    },
    paragraph: {
        name: 'Paragraph',
        html: (content) => `<p class="esd-preview-paragraph">${content.text || 'Paragraph text goes here.'}</p>`,
        contentFields: ['text'],
        defaultContent: { text: 'Paragraph text goes here.' }
    },
    label: {
        name: 'Label',
        html: (content) => `<label class="esd-preview-label">${content.text || 'Label'}</label>`,
        contentFields: ['text'],
        defaultContent: { text: 'Label' }
    },
    badge: {
        name: 'Badge / Tag',
        html: (content) => `<span class="esd-preview-badge">${content.text || 'Badge'}</span>`,
        contentFields: ['text'],
        defaultContent: { text: 'Badge' }
    },
    alert: {
        name: 'Alert / Message',
        html: (content) => `<div class="esd-preview-alert">
            <div class="esd-alert-icon">ℹ</div>
            <div class="esd-alert-content">
                <strong>${content.title || 'Alert Title'}</strong>
                <p>${content.message || 'Alert message goes here.'}</p>
            </div>
        </div>`,
        contentFields: ['title', 'message'],
        defaultContent: { title: 'Alert Title', message: 'Alert message goes here.' }
    },
    link: {
        name: 'Link',
        html: (content) => `<a class="esd-preview-link" href="javascript:void(0)">${content.text || 'Link text'}</a>`,
        contentFields: ['text'],
        defaultContent: { text: 'Link text' }
    },
    table: {
        name: 'Table Wrapper',
        html: (content) => `<table class="esd-preview-table">
            <thead>
                <tr>
                    <th>Header 1</th>
                    <th>Header 2</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Cell 1</td>
                    <td>Cell 2</td>
                </tr>
            </tbody>
        </table>`,
        contentFields: [],
        defaultContent: {}
    },
    listitem: {
        name: 'List Item',
        html: (content) => `<li class="esd-preview-listitem">${content.text || 'List item text'}</li>`,
        contentFields: ['text'],
        defaultContent: { text: 'List item text' }
    },
    navitem: {
        name: 'Nav Item',
        html: (content) => `<a class="esd-preview-navitem" href="javascript:void(0)">${content.text || 'Navigation Item'}</a>`,
        contentFields: ['text'],
        defaultContent: { text: 'Navigation Item' }
    },
    panel: {
        name: 'Panel',
        html: (content) => `<div class="esd-preview-panel">
            <div class="esd-panel-header">${content.heading || 'Panel Header'}</div>
            <div class="esd-panel-body">${content.body || 'Panel content.'}</div>
        </div>`,
        contentFields: ['heading', 'body'],
        defaultContent: { heading: 'Panel Header', body: 'Panel content.' }
    },
    imageframe: {
        name: 'Image Frame Placeholder',
        html: (content) => `<div class="esd-preview-imageframe">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiBmaWxsLW9wYWNpdHk9IjAuMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==" alt="Placeholder" />
        </div>`,
        contentFields: [],
        defaultContent: {}
    },
    iconbutton: {
        name: 'Icon Button',
        html: (content) => `<button class="esd-preview-iconbutton" type="button" aria-label="${content.label || 'Action'}">
            <span class="esd-icon">★</span>
        </button>`,
        contentFields: ['label'],
        defaultContent: { label: 'Action' }
    },
    chip: {
        name: 'Chip / Pill',
        html: (content) => `<div class="esd-preview-chip">
            <span>${content.text || 'Chip'}</span>
        </div>`,
        contentFields: ['text'],
        defaultContent: { text: 'Chip' }
    }
};

// ============================================================================
// PRESETS
// ============================================================================

const PRESETS = {
    'primary-button': {
        label: 'Primary Button',
        elementType: 'button',
        styles: {
            default: {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '0.625rem',
                paddingRight: '1rem',
                paddingBottom: '0.625rem',
                paddingLeft: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#ffffff',
                backgroundColor: '#1f4fd1',
                border: '1px solid #1f4fd1',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transitionProperty: 'background-color, transform',
                transitionDuration: '0.2s, 0.1s',
                transitionTimingFunction: 'ease, ease'
            },
            hover: {
                backgroundColor: '#173ca0'
            },
            focus: {
                outline: '2px solid #8bb2ff',
                outlineOffset: '2px'
            },
            active: {
                transform: 'translateY(1px)'
            },
            disabled: {
                opacity: '0.6',
                cursor: 'not-allowed'
            }
        },
        previewContent: { text: 'Save Changes' }
    },
    'secondary-button': {
        label: 'Secondary Button',
        elementType: 'button',
        styles: {
            default: {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '0.625rem',
                paddingRight: '1rem',
                paddingBottom: '0.625rem',
                paddingLeft: '1rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1f4fd1',
                backgroundColor: 'transparent',
                border: '1px solid #1f4fd1',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transitionProperty: 'background-color',
                transitionDuration: '0.2s',
                transitionTimingFunction: 'ease'
            },
            hover: {
                backgroundColor: '#f0f4ff'
            },
            focus: {
                outline: '2px solid #1f4fd1',
                outlineOffset: '2px'
            },
            disabled: {
                opacity: '0.5',
                cursor: 'not-allowed'
            }
        },
        previewContent: { text: 'Cancel' }
    },
    'text-input': {
        label: 'Text Input',
        elementType: 'input',
        styles: {
            default: {
                display: 'inline-block',
                paddingTop: '0.5rem',
                paddingRight: '0.75rem',
                paddingBottom: '0.5rem',
                paddingLeft: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #cccccc',
                borderRadius: '0.375rem',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                transitionProperty: 'border-color, box-shadow',
                transitionDuration: '0.2s',
                transitionTimingFunction: 'ease'
            },
            focus: {
                borderColor: '#1f4fd1',
                outline: 'none',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(31, 79, 209, 0.1)'
            },
            disabled: {
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
            }
        },
        previewContent: { placeholder: 'Enter your name...' }
    },
    'card-panel': {
        label: 'Card Panel',
        elementType: 'card',
        styles: {
            default: {
                display: 'block',
                paddingTop: '1.5rem',
                paddingRight: '1.5rem',
                paddingBottom: '1.5rem',
                paddingLeft: '1.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            },
            hover: {
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }
        },
        previewContent: { title: 'Card Title', body: 'This is a beautiful card with content.' }
    },
    'alert-box': {
        label: 'Alert Box',
        elementType: 'alert',
        styles: {
            default: {
                display: 'flex',
                paddingTop: '1rem',
                paddingRight: '1rem',
                paddingBottom: '1rem',
                paddingLeft: '1rem',
                backgroundColor: '#e7f1ff',
                border: '1px solid #8bb2ff',
                borderRadius: '0.375rem',
                color: '#1f4fd1'
            }
        },
        previewContent: { title: 'Information', message: 'This is an informational alert.' }
    },
    'badge': {
        label: 'Badge',
        elementType: 'badge',
        styles: {
            default: {
                display: 'inline-block',
                paddingTop: '0.25rem',
                paddingRight: '0.625rem',
                paddingBottom: '0.25rem',
                paddingLeft: '0.625rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                backgroundColor: '#1f4fd1',
                color: '#ffffff',
                borderRadius: '0.25rem'
            }
        },
        previewContent: { text: 'New' }
    },
    'link': {
        label: 'Link',
        elementType: 'link',
        styles: {
            default: {
                color: '#1f4fd1',
                textDecoration: 'none',
                cursor: 'pointer',
                transitionProperty: 'color',
                transitionDuration: '0.2s'
            },
            hover: {
                color: '#173ca0',
                textDecoration: 'underline'
            },
            focus: {
                outline: '2px solid #8bb2ff',
                outlineOffset: '2px'
            }
        },
        previewContent: { text: 'Click here' }
    },
    'section-block': {
        label: 'Section Block',
        elementType: 'section',
        styles: {
            default: {
                display: 'block',
                paddingTop: '2rem',
                paddingRight: '1.5rem',
                paddingBottom: '2rem',
                paddingLeft: '1.5rem',
                marginBottom: '2rem',
                borderBottom: '1px solid #e5e5e5'
            }
        },
        previewContent: { heading: 'Section Heading', description: 'This section contains important information.' }
    },
    'disabled-button': {
        label: 'Disabled Button',
        elementType: 'button',
        styles: {
            default: {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '0.625rem',
                paddingRight: '1rem',
                paddingBottom: '0.625rem',
                paddingLeft: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#999999',
                backgroundColor: '#f0f0f0',
                border: '1px solid #dddddd',
                borderRadius: '0.5rem',
                cursor: 'not-allowed',
                opacity: '0.6'
            }
        },
        previewContent: { text: 'Disabled' }
    },
    'focused-input': {
        label: 'Focused Input',
        elementType: 'input',
        styles: {
            default: {
                display: 'inline-block',
                paddingTop: '0.5rem',
                paddingRight: '0.75rem',
                paddingBottom: '0.5rem',
                paddingLeft: '0.75rem',
                fontSize: '1rem',
                border: '2px solid #1f4fd1',
                borderRadius: '0.375rem',
                boxShadow: '0 0 0 3px rgba(31, 79, 209, 0.1)',
                outline: 'none'
            }
        },
        previewContent: { placeholder: 'Focused input...' }
    }
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const DesignerState = {
    selectedElementType: 'button',
    className: 'my-button',
    label: 'My Button',
    previewContent: ELEMENT_TYPES.button.defaultContent,
    styles: {
        default: {},
        hover: {},
        focus: {},
        active: {},
        disabled: {}
    },
    simulationState: {
        hover: false,
        focus: false,
        active: false,
        disabled: false
    },
    customCssRaw: '',
    parseWarnings: [],
    currentEditingState: 'hover',
    savedDesigns: [],
    dirty: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeDesigner() {
    loadDraftFromLocalStorage();
    bindGlobalEvents();
    populateSavedDesigns();
    renderAllPanels();
    markClean();
}

function bindGlobalEvents() {
    // Element type change
    document.getElementById('esd-element-type').addEventListener('change', (e) => {
        DesignerState.selectedElementType = e.target.value;
        DesignerState.previewContent = { ...ELEMENT_TYPES[e.target.value].defaultContent };
        renderPreviewPanel();
        renderOutputPanels();
        markDirty();
    });

    // Class name input
    document.getElementById('esd-class-name').addEventListener('input', (e) => {
        DesignerState.className = sanitizeClassName(e.target.value);
        renderOutputPanels();
        markDirty();
    });

    // Friendly label input
    document.getElementById('esd-label').addEventListener('input', (e) => {
        DesignerState.label = e.target.value;
        markDirty();
    });

    // Preset selector
    document.getElementById('esd-preset').addEventListener('change', (e) => {
        if (e.target.value) {
            loadPreset(e.target.value);
        }
    });

    // Duplicate design
    document.getElementById('esd-duplicate-btn').addEventListener('click', () => {
        duplicateDesign();
    });

    // Reset button
    document.getElementById('esd-reset-btn').addEventListener('click', () => {
        if (confirm('Reset to initial state?')) {
            resetDesigner();
        }
    });

    // Export JSON
    document.getElementById('esd-export-json-btn').addEventListener('click', () => {
        exportConfig();
    });

    // Import JSON
    document.getElementById('esd-import-json-btn').addEventListener('click', () => {
        importConfig();
    });

    // Collapse/expand control groups
    document.querySelectorAll('.esd-collapse-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const group = e.currentTarget.closest('.esd-control-group');
            const content = group.querySelector('.esd-control-group-content');
            const icon = e.currentTarget.querySelector('.esd-collapse-icon');
            const isExpanded = content.style.display !== 'none';
            content.style.display = isExpanded ? 'none' : 'block';
            icon.textContent = isExpanded ? '▶' : '▼';
        });
    });

    // Simulation checkboxes
    document.querySelectorAll('.esd-simulation-controls input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const state = e.target.dataset.state;
            DesignerState.simulationState[state] = e.target.checked;
            applySimulationState();
        });
    });

    // State override tabs
    document.querySelectorAll('.esd-state-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.esd-state-tab').forEach(t => t.classList.remove('esd-state-tab-active'));
            e.currentTarget.classList.add('esd-state-tab-active');
            DesignerState.currentEditingState = e.currentTarget.dataset.state;
            renderStateOverrideControls();
        });
    });

    // Output tabs
    document.querySelectorAll('.esd-output-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.esd-output-tab').forEach(t => t.classList.remove('esd-output-tab-active'));
            e.currentTarget.classList.add('esd-output-tab-active');

            document.querySelectorAll('.esd-output-view').forEach(v => v.classList.remove('esd-output-view-active'));
            const viewId = 'esd-view-' + e.currentTarget.dataset.view;
            document.getElementById(viewId).classList.add('esd-output-view-active');
        });
    });

    // Copy buttons
    document.getElementById('esd-copy-css-btn').addEventListener('click', () => {
        copyToClipboard(document.getElementById('esd-generated-css-output').textContent, 'CSS copied!');
    });

    document.getElementById('esd-copy-markup-btn').addEventListener('click', () => {
        copyToClipboard(document.getElementById('esd-generated-markup-output').textContent, 'Markup copied!');
    });

    document.getElementById('esd-copy-helper-btn').addEventListener('click', () => {
        copyToClipboard(document.getElementById('esd-generated-helper-output').textContent, 'Tag Helper example copied!');
    });

    document.getElementById('esd-copy-all-markup-btn').addEventListener('click', () => {
        const markup = document.getElementById('esd-generated-markup-output').textContent;
        const helper = document.getElementById('esd-generated-helper-output').textContent;
        copyToClipboard(markup + '\n\n' + helper, 'All markup copied!');
    });

    // Download CSS
    document.getElementById('esd-download-css-btn').addEventListener('click', () => {
        downloadCss();
    });

    // CSS Editor controls
    document.getElementById('esd-apply-raw-css-btn').addEventListener('click', () => {
        applyRawCss();
    });

    document.getElementById('esd-sync-parsed-css-btn').addEventListener('click', () => {
        syncParsedCssToControls();
    });

    document.getElementById('esd-format-css-btn').addEventListener('click', () => {
        formatRawCss();
    });

    document.getElementById('esd-rebuild-css-btn').addEventListener('click', () => {
        rebuildCssFromControls();
    });

    // Save design
    document.getElementById('esd-save-design-btn').addEventListener('click', () => {
        saveDesign();
    });

    // Opacity slider
    document.getElementById('esd-opacity').addEventListener('input', (e) => {
        document.querySelector('.esd-opacity-value').textContent = parseFloat(e.target.value).toFixed(2);
    });
}

function bindControlInputs() {
    // Bind all style control inputs
    document.querySelectorAll('[name^="default."]').forEach(input => {
        input.addEventListener('change', () => {
            updateStateFromControls();
        });
        input.addEventListener('input', () => {
            markDirty();
        });
    });

    // Color pickers sync to text inputs
    document.getElementById('esd-text-color-picker').addEventListener('change', (e) => {
        document.getElementById('esd-text-color').value = e.target.value;
        updateStateFromControls();
    });

    document.getElementById('esd-background-color-picker').addEventListener('change', (e) => {
        document.getElementById('esd-background-color').value = e.target.value;
        updateStateFromControls();
    });

    document.getElementById('esd-border-color-picker').addEventListener('change', (e) => {
        document.getElementById('esd-border-color').value = e.target.value;
        updateStateFromControls();
    });

    // Text input to color picker sync
    document.getElementById('esd-text-color').addEventListener('blur', (e) => {
        try {
            document.getElementById('esd-text-color-picker').value = rgbToHex(e.target.value) || '#000000';
        } catch { }
    });

    document.getElementById('esd-background-color').addEventListener('blur', (e) => {
        try {
            document.getElementById('esd-background-color-picker').value = rgbToHex(e.target.value) || '#ffffff';
        } catch { }
    });

    document.getElementById('esd-border-color').addEventListener('blur', (e) => {
        try {
            document.getElementById('esd-border-color-picker').value = rgbToHex(e.target.value) || '#cccccc';
        } catch { }
    });
}

// ============================================================================
// CONTROL GROUP RENDERING
// ============================================================================

function renderStateOverrideControls() {
    const state = DesignerState.currentEditingState;
    const container = document.getElementById('esd-state-overrides');
    container.innerHTML = '';

    // Common properties available for state overrides
    const stateProperties = [
        { name: 'backgroundColor', label: 'Background Color', type: 'color' },
        { name: 'color', label: 'Text Color', type: 'color' },
        { name: 'borderColor', label: 'Border Color', type: 'color' },
        { name: 'opacity', label: 'Opacity', type: 'range', min: 0, max: 1, step: 0.05 },
        { name: 'transform', label: 'Transform', type: 'text' },
        { name: 'boxShadow', label: 'Box Shadow', type: 'textarea' },
        { name: 'textShadow', label: 'Text Shadow', type: 'text' },
        { name: 'outline', label: 'Outline', type: 'text' },
        { name: 'outlineOffset', label: 'Outline Offset', type: 'text' },
        { name: 'cursor', label: 'Cursor', type: 'select', options: ['auto', 'default', 'pointer', 'not-allowed', 'text', 'wait', 'move'] }
    ];

    stateProperties.forEach(prop => {
        const value = DesignerState.styles[state][prop.name] || '';
        const controlId = `esd-state-${state}-${prop.name}`;

        const wrapper = document.createElement('div');
        wrapper.className = 'esd-control';

        const label = document.createElement('label');
        label.htmlFor = controlId;
        label.textContent = prop.label;
        wrapper.appendChild(label);

        let input;
        if (prop.type === 'textarea') {
            input = document.createElement('textarea');
            input.id = controlId;
            input.value = value;
            input.rows = 2;
        } else if (prop.type === 'select') {
            input = document.createElement('select');
            input.id = controlId;
            const optEmpty = document.createElement('option');
            optEmpty.value = '';
            optEmpty.textContent = '— unset —';
            input.appendChild(optEmpty);
            prop.options.forEach(opt => {
                const optEl = document.createElement('option');
                optEl.value = opt;
                optEl.textContent = opt;
                input.appendChild(optEl);
            });
            input.value = value;
        } else if (prop.type === 'range') {
            input = document.createElement('input');
            input.type = 'range';
            input.id = controlId;
            input.min = prop.min;
            input.max = prop.max;
            input.step = prop.step;
            input.value = value || '1';
        } else if (prop.type === 'color') {
            input = document.createElement('input');
            input.type = 'color';
            input.id = controlId;
            input.value = rgbToHex(value) || '#000000';
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.id = controlId;
            input.value = value;
        }

        input.addEventListener('change', () => {
            DesignerState.styles[state][prop.name] = input.value;
            renderOutputPanels();
            applySimulationState();
            markDirty();
        });

        wrapper.appendChild(input);
        container.appendChild(wrapper);
    });
}

// ============================================================================
// PREVIEW CONTENT EDITOR
// ============================================================================

function renderPreviewContentControls() {
    const type = DesignerState.selectedElementType;
    const typeDef = ELEMENT_TYPES[type];
    const container = document.getElementById('esd-preview-content-controls');
    container.innerHTML = '';

    if (!typeDef.contentFields || typeDef.contentFields.length === 0) {
        container.innerHTML = '<p class="esd-subtle-text">No content fields for this element type.</p>';
        return;
    }

    typeDef.contentFields.forEach(field => {
        const value = DesignerState.previewContent[field] || '';
        const control = document.createElement('div');
        control.className = 'esd-control';

        const label = document.createElement('label');
        label.textContent = field.charAt(0).toUpperCase() + field.slice(1);
        control.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.addEventListener('input', (e) => {
            DesignerState.previewContent[field] = e.target.value;
            renderPreviewMarkup();
            markDirty();
        });

        control.appendChild(input);
        container.appendChild(control);
    });
}

// ============================================================================
// UPDATE STATE FROM CONTROLS
// ============================================================================

function updateStateFromControls() {
    document.querySelectorAll('[name^="default."]').forEach(input => {
        const key = input.name.replace('default.', '');
        const value = input.value.trim();
        if (value) {
            DesignerState.styles.default[key] = value;
        } else {
            delete DesignerState.styles.default[key];
        }
    });

    renderPreviewMarkup();
    renderOutputPanels();
    markDirty();
}

// ============================================================================
// PREVIEW RENDERING
// ============================================================================

function renderPreviewPanel() {
    renderPreviewContentControls();
    renderPreviewMarkup();
    renderStateOverrideControls();
}

function renderPreviewMarkup() {
    const type = DesignerState.selectedElementType;
    const typeDef = ELEMENT_TYPES[type];
    const container = document.getElementById('esd-preview-element');

    // Build element HTML
    const elementHtml = typeDef.html(DesignerState.previewContent);
    container.innerHTML = elementHtml;

    // Find the main preview element
    const previewEl = container.querySelector('[class^="esd-preview-"]') || container.firstElementChild;
    if (previewEl) {
        previewEl.className += ' ' + DesignerState.className;

        // Apply inline styles from the current state
        applyStylesToElement(previewEl, DesignerState.styles.default);

        // Apply simulation state styles
        applySimulationState();
    }
}

function applyStylesToElement(el, styles) {
    Object.entries(styles).forEach(([key, value]) => {
        if (value) {
            const cssKey = camelToKebab(key);
            el.style[cssKey] = value;
        }
    });
}

function applySimulationState() {
    const previewEl = document.querySelector(`.${DesignerState.className}`);
    if (!previewEl) return;

    // Clear simulation classes
    previewEl.classList.remove('is-hover', 'is-focus', 'is-active', 'is-disabled');

    // Add active simulation classes and apply state styles
    const appliedStyles = { ...DesignerState.styles.default };

    if (DesignerState.simulationState.hover) {
        previewEl.classList.add('is-hover');
        Object.assign(appliedStyles, DesignerState.styles.hover);
    }
    if (DesignerState.simulationState.focus) {
        previewEl.classList.add('is-focus');
        Object.assign(appliedStyles, DesignerState.styles.focus);
    }
    if (DesignerState.simulationState.active) {
        previewEl.classList.add('is-active');
        Object.assign(appliedStyles, DesignerState.styles.active);
    }
    if (DesignerState.simulationState.disabled) {
        previewEl.classList.add('is-disabled');
        Object.assign(appliedStyles, DesignerState.styles.disabled);
    }

    applyStylesToElement(previewEl, appliedStyles);
}

// ============================================================================
// CSS GENERATION
// ============================================================================

function generateCssText() {
    const className = DesignerState.className || 'my-class';
    let css = '';

    // Default state
    const defaultStyles = buildCssBlock(className, DesignerState.styles.default);
    if (defaultStyles) {
        css += defaultStyles + '\n';
    }

    // State-specific selectors
    ['hover', 'focus', 'active', 'disabled'].forEach(state => {
        const stateStyles = DesignerState.styles[state];
        if (Object.keys(stateStyles).length > 0) {
            const selector = `.${className}:${state}`;
            const block = buildCssBlock(selector, stateStyles, false);
            if (block) {
                css += '\n' + block + '\n';
            }
        }
    });

    return css.trim();
}

function buildCssBlock(selector, styles, includeSelector = true) {
    const props = Object.entries(styles)
        .filter(([, val]) => val)
        .map(([key, val]) => `  ${camelToKebab(key)}: ${val};`)
        .join('\n');

    if (!props) return '';

    const open = includeSelector ? `${selector} {\n` : `${selector} {\n`;
    const close = '}\n';
    return open + props + '\n' + close;
}

function generateMarkupText() {
    const type = DesignerState.selectedElementType;
    const typeDef = ELEMENT_TYPES[type];
    return typeDef.html(DesignerState.previewContent);
}

function generateHelperText() {
    const type = DesignerState.selectedElementType;
    const content = generateMarkupText();

    // Map to potential Tag Helper names
    const helperMap = {
        button: 'ui-button',
        input: 'ui-input',
        card: 'ui-card',
        alert: 'ui-alert',
        badge: 'ui-badge',
        link: 'ui-link',
        table: 'ui-table'
    };

    const helperName = helperMap[type] || `ui-${type}`;

    // For simple elements, show simplified tag helper version
    if (type === 'button') {
        return `&lt;${helperName} class="${DesignerState.className}" type="button"&gt;\n  Click me\n&lt;/${helperName}&gt;`;
    } else if (type === 'card') {
        return `&lt;${helperName} class="${DesignerState.className}"&gt;\n  &lt;h3&gt;Card Title&lt;/h3&gt;\n  &lt;p&gt;Card content&lt;/p&gt;\n&lt;/${helperName}&gt;`;
    } else if (type === 'input') {
        return `&lt;${helperName} class="${DesignerState.className}" type="text" placeholder="Enter text..." /&gt;`;
    }

    return `&lt;${helperName} class="${DesignerState.className}"&gt;&lt;/${helperName}&gt;`;
}

// ============================================================================
// OUTPUT PANELS
// ============================================================================

function renderOutputPanels() {
    // Generated CSS
    document.getElementById('esd-generated-css-output').textContent = generateCssText();
    document.getElementById('esd-generated-css-output').parentElement.className = 'language-css';

    // Markup
    document.getElementById('esd-generated-markup-output').textContent = prettier(generateMarkupText());
    document.getElementById('esd-generated-markup-output').parentElement.className = 'language-html';

    document.getElementById('esd-generated-helper-output').textContent = generateHelperText();
    document.getElementById('esd-generated-helper-output').parentElement.className = 'language-html';

    // Load raw CSS input
    if (!DesignerState.customCssRaw || DesignerState.customCssRaw.trim() === '') {
        DesignerState.customCssRaw = generateCssText();
    }
    document.getElementById('esd-raw-css-input').value = DesignerState.customCssRaw;

    // Highlight syntax (if Prism available)
    if (window.Prism) {
        Prism.highlightAllUnder(document.querySelector('.esd-output-view-active'));
    }
}

// ============================================================================
// CSS PARSING & SYNCING
// ============================================================================

function parseCssText(cssText) {
    const parsed = {
        default: {},
        hover: {},
        focus: {},
        active: {},
        disabled: {}
    };

    const warnings = [];
    let currentState = 'default';

    // Simple CSS parser - regex based
    const ruleRegex = /\.([\w-]+)(?::(\w+))?\s*\{([^}]+)\}/g;
    let match;

    while ((match = ruleRegex.exec(cssText)) !== null) {
        const className = match[1];
        const pseudoState = match[2] || 'default';
        const declarations = match[3];

        if (className === DesignerState.className) {
            const propRegex = /\s*([\w-]+)\s*:\s*([^;]+);/g;
            let propMatch;

            while ((propMatch = propRegex.exec(declarations)) !== null) {
                const propName = kebabToCamel(propMatch[1]);
                const propValue = propMatch[2].trim();

                if (parsed[pseudoState]) {
                    parsed[pseudoState][propName] = propValue;
                } else {
                    warnings.push(`Unrecognized pseudo-state: :${pseudoState}`);
                }
            }
        }
    }

    DesignerState.parseWarnings = warnings;
    return parsed;
}

function applyRawCss() {
    const cssText = document.getElementById('esd-raw-css-input').value;
    DesignerState.customCssRaw = cssText;

    // Create a temporary stylesheet
    const tempSheet = document.createElement('style');
    tempSheet.textContent = cssText;
    document.head.appendChild(tempSheet);

    // Apply to preview
    renderPreviewMarkup();

    // Remove temp sheet after a moment (just for preview)
    setTimeout(() => {
        document.head.removeChild(tempSheet);
        // Re-apply default styles
        renderPreviewMarkup();
    }, 50);

    markDirty();
}

function syncParsedCssToControls() {
    const cssText = document.getElementById('esd-raw-css-input').value;
    const parsed = parseCssText(cssText);

    DesignerState.styles = parsed;

    // Update form controls
    Object.entries(parsed.default).forEach(([key, val]) => {
        const controlName = `esd-${camelToKebab(key)}`;
        const el = document.getElementById(controlName);
        if (el) {
            el.value = val;
        }
    });

    renderPreviewMarkup();
    displayParseWarnings();
    markDirty();
}

function rebuildCssFromControls() {
    if (confirm('Rebuild CSS from controls? This will overwrite the raw CSS editor.')) {
        const newCss = generateCssText();
        document.getElementById('esd-raw-css-input').value = newCss;
        DesignerState.customCssRaw = newCss;
        markDirty();
    }
}

function formatRawCss() {
    const cssText = document.getElementById('esd-raw-css-input').value;
    const formatted = prettier(cssText);
    document.getElementById('esd-raw-css-input').value = formatted;
    DesignerState.customCssRaw = formatted;
}

function displayParseWarnings() {
    const container = document.getElementById('esd-parse-warnings');
    if (DesignerState.parseWarnings.length === 0) {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
        container.innerHTML = '<strong>Parse Warnings:</strong><ul>' +
            DesignerState.parseWarnings.map(w => `<li>${w}</li>`).join('') +
            '</ul>';
    }
}

// ============================================================================
// PRESETS & DUPLICATION
// ============================================================================

function loadPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    DesignerState.className = '';
    DesignerState.label = preset.label;
    DesignerState.selectedElementType = preset.elementType;
    DesignerState.styles = JSON.parse(JSON.stringify(preset.styles));
    DesignerState.previewContent = { ...preset.previewContent };

    document.getElementById('esd-element-type').value = preset.elementType;
    document.getElementById('esd-label').value = preset.label;
    document.getElementById('esd-preset').value = '';

    renderAllPanels();
    markDirty();
}

function duplicateDesign() {
    const newClass = DesignerState.className + '-copy';
    DesignerState.className = newClass;
    document.getElementById('esd-class-name').value = newClass;
    renderOutputPanels();
    markDirty();
}

function resetDesigner() {
    DesignerState.selectedElementType = 'button';
    DesignerState.className = 'my-button';
    DesignerState.label = 'My Button';
    DesignerState.styles = {
        default: {},
        hover: {},
        focus: {},
        active: {},
        disabled: {}
    };
    DesignerState.simulationState = { hover: false, focus: false, active: false, disabled: false };
    DesignerState.previewContent = { ...ELEMENT_TYPES.button.defaultContent };
    DesignerState.customCssRaw = '';
    DesignerState.parseWarnings = [];

    document.getElementById('esd-element-type').value = 'button';
    document.getElementById('esd-class-name').value = 'my-button';
    document.getElementById('esd-label').value = 'My Button';
    document.getElementById('esd-preset').value = '';

    // Clear all form inputs
    document.querySelectorAll('[name^="default."]').forEach(el => {
        el.value = '';
    });

    renderAllPanels();
    markClean();
}

// ============================================================================
// SAVE/LOAD DESIGNS
// ============================================================================

function saveDesign() {
    const name = prompt('Enter a name for this design:', DesignerState.label || 'Unnamed Design');
    if (!name) return;

    const design = {
        id: Date.now().toString(),
        name: name,
        timestamp: new Date().toISOString(),
        elementType: DesignerState.selectedElementType,
        className: DesignerState.className,
        label: DesignerState.label,
        styles: JSON.parse(JSON.stringify(DesignerState.styles)),
        previewContent: JSON.parse(JSON.stringify(DesignerState.previewContent))
    };

    DesignerState.savedDesigns.push(design);
    saveDraftToLocalStorage();
    populateSavedDesigns();
    alert(`Design saved as "${name}"`);
}

function populateSavedDesigns() {
    const container = document.getElementById('esd-saved-list');
    container.innerHTML = '';

    if (DesignerState.savedDesigns.length === 0) {
        container.innerHTML = '<p class="esd-subtle-text">No saved designs yet.</p>';
        return;
    }

    DesignerState.savedDesigns.forEach(design => {
        const item = document.createElement('div');
        item.className = 'esd-saved-item';

        const nameEl = document.createElement('div');
        nameEl.className = 'esd-saved-name';
        nameEl.textContent = design.name;
        item.appendChild(nameEl);

        const dateEl = document.createElement('div');
        dateEl.className = 'esd-saved-date';
        dateEl.textContent = new Date(design.timestamp).toLocaleString();
        item.appendChild(dateEl);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'esd-saved-buttons';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'esd-btn esd-btn-tiny';
        loadBtn.textContent = 'Open';
        loadBtn.addEventListener('click', () => {
            DesignerState.elementType = design.elementType;
            DesignerState.className = design.className;
            DesignerState.label = design.label;
            DesignerState.styles = JSON.parse(JSON.stringify(design.styles));
            DesignerState.previewContent = JSON.parse(JSON.stringify(design.previewContent));
            renderAllPanels();
            markClean();
        });
        buttonsDiv.appendChild(loadBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'esd-btn esd-btn-tiny esd-btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete this design?')) {
                DesignerState.savedDesigns = DesignerState.savedDesigns.filter(d => d.id !== design.id);
                saveDraftToLocalStorage();
                populateSavedDesigns();
            }
        });
        buttonsDiv.appendChild(deleteBtn);

        item.appendChild(buttonsDiv);
        container.appendChild(item);
    });
}

function exportConfig() {
    const config = {
        selectedElementType: DesignerState.selectedElementType,
        className: DesignerState.className,
        label: DesignerState.label,
        styles: DesignerState.styles,
        previewContent: DesignerState.previewContent
    };

    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${DesignerState.className || 'design'}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);
                DesignerState.selectedElementType = config.selectedElementType;
                DesignerState.className = config.className;
                DesignerState.label = config.label;
                DesignerState.styles = config.styles;
                DesignerState.previewContent = config.previewContent;

                document.getElementById('esd-element-type').value = DesignerState.selectedElementType;
                document.getElementById('esd-class-name').value = DesignerState.className;
                document.getElementById('esd-label').value = DesignerState.label;

                renderAllPanels();
                markDirty();
                alert('Design imported successfully!');
            } catch (err) {
                alert('Error importing design: ' + err.message);
            }
        };
        reader.readAsText(file);
    });
    input.click();
}

// ============================================================================
// PERSISTENCE
// ============================================================================

function saveDraftToLocalStorage() {
    const draft = {
        selectedElementType: DesignerState.selectedElementType,
        className: DesignerState.className,
        label: DesignerState.label,
        styles: DesignerState.styles,
        simulationState: DesignerState.simulationState,
        previewContent: DesignerState.previewContent,
        customCssRaw: DesignerState.customCssRaw,
        savedDesigns: DesignerState.savedDesigns
    };

    localStorage.setItem('esd-draft', JSON.stringify(draft));
}

function loadDraftFromLocalStorage() {
    const stored = localStorage.getItem('esd-draft');
    if (stored) {
        try {
            const draft = JSON.parse(stored);
            Object.assign(DesignerState, draft);
        } catch (err) {
            console.warn('Could not load draft from localStorage:', err);
        }
    }
}

function markDirty() {
    DesignerState.dirty = true;
    saveDraftToLocalStorage();
    document.getElementById('esd-dirty-indicator').style.display = 'flex';
}

function markClean() {
    DesignerState.dirty = false;
    document.getElementById('esd-dirty-indicator').style.display = 'none';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sanitizeClassName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}

function camelToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

function kebabToCamel(str) {
    return str.replace(/-./g, x => x[1].toUpperCase());
}

function rgbToHex(rgb) {
    // If already hex, return as is
    if (rgb && rgb.startsWith('#')) return rgb;

    // Parse rgb format
    const match = rgb && rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
        const hex = (parseInt(match[1]).toString(16).padStart(2, '0') +
            parseInt(match[2]).toString(16).padStart(2, '0') +
            parseInt(match[3]).toString(16).padStart(2, '0')).toUpperCase();
        return '#' + hex;
    }
    return null;
}

function prettier(str) {
    // Basic formatting helper
    return str;
}

function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = message || 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        alert('Copy failed');
    });
}

function downloadCss() {
    const css = generateCssText();
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${DesignerState.className || 'styles'}.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// RENDER ALL
// ============================================================================

function renderAllPanels() {
    // Update all form fields
    document.getElementById('esd-element-type').value = DesignerState.selectedElementType;
    document.getElementById('esd-class-name').value = DesignerState.className;
    document.getElementById('esd-label').value = DesignerState.label;

    bindControlInputs();
    renderStateOverrideControls();
    renderPreviewPanel();
    renderOutputPanels();
}

// ============================================================================
// DOCUMENT READY
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDesigner();
});
