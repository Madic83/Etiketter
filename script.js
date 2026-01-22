// Label Editor Application
class LabelEditor {
    constructor() {
        this.labels = [];
        this.selectedLabel = null;
        this.selectedElement = null;
        this.draggingElement = null;
        this.resizingElement = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartLeft = 0;
        this.dragStartTop = 0;
        this.draggingFromContentEditable = false;
        this.draggingActive = false;
        this.copiedLabel = null;
        this.selectedLabels = new Set();
        this.isSelecting = false;
        this.selectionStartX = 0;
        this.selectionStartY = 0;
        this.selectionBox = null;
        this.clickedLabel = null;
        this.hasDragged = false;
        this.hasStartedDrag = false;
        
        this.initializeLabels();
        this.setupEventListeners();
        this.render();

        // Ensure there is always a selected label (default to first)
        this.ensureSelectedLabel();
    }

    // Initialize 30 empty labels (3 columns x 10 rows)
    initializeLabels() {
        this.labels = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            elements: [],
            backgroundColor: '#ffffff'
        }));
    }

    // Setup all event listeners
    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('addTextBtn').addEventListener('click', () => this.addTextElement());
        document.getElementById('addImageBtn').addEventListener('click', () => this.openImageUpload());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteSelectedElement());
        document.getElementById('printBtn').addEventListener('click', () => this.print());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadJSON());
        document.getElementById('uploadBtn').addEventListener('click', () => this.openLoadFile());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllLabels());
        document.getElementById('copyLabelBtn').addEventListener('click', () => this.copyLabel());
        document.getElementById('pasteLabelBtn').addEventListener('click', () => this.pasteLabel());
        document.getElementById('copyToSelectedBtn').addEventListener('click', () => this.copyToSelectedLabels());

        // Image input
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('loadInput').addEventListener('change', (e) => this.handleLoadFile(e));

        // Property panel
        document.getElementById('textContent').addEventListener('input', () => this.updateSelectedElement());
        document.getElementById('fontFamily').addEventListener('change', () => this.updateSelectedElement());
        document.getElementById('fontSize').addEventListener('input', (e) => {
            document.getElementById('fontSizeNumber').value = e.target.value;
            this.updateSelectedElement();
        });
        document.getElementById('fontSizeNumber').addEventListener('input', (e) => {
            document.getElementById('fontSize').value = e.target.value;
            this.updateSelectedElement();
        });
        document.getElementById('textColor').addEventListener('change', () => this.updateSelectedElement());
        document.getElementById('backgroundColor').addEventListener('change', () => this.updateLabelBackground());
        document.getElementById('boldText').addEventListener('change', () => this.updateSelectedElement());
        document.getElementById('italicText').addEventListener('change', () => this.updateSelectedElement());
        document.getElementById('underlineText').addEventListener('change', () => this.updateSelectedElement());
        document.getElementById('imageOpacity').addEventListener('input', (e) => {
            document.getElementById('imageOpacityNumber').value = e.target.value;
            this.updateSelectedElement();
        });
        document.getElementById('imageOpacityNumber').addEventListener('input', (e) => {
            document.getElementById('imageOpacity').value = e.target.value;
            this.updateSelectedElement();
        });

        // Text alignment
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateSelectedElement();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Click outside elements to deselect element highlight
        document.addEventListener('click', (e) => {
            // Allow clicks inside control panel/inputs/textareas without deselecting
            if (e.target.closest('.control-panel')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            if (e.target.closest('.label-element')) return;
            if (e.target.closest('.label')) return;
            
            // Deselect both element and label when clicking outside
            if (this.selectedElement || this.selectedLabel) {
                this.selectedElement = null;
                this.selectedLabel = null;
                document.querySelectorAll('.label-element').forEach(el => el.classList.remove('selected'));
                document.querySelectorAll('.label').forEach(el => el.classList.remove('selected'));
                this.updatePropertyPanel();
            }
        });
    }

    addTextElement() {
        if (!this.selectedLabel) {
            alert('Please select a label first');
            return;
        }

        const element = {
            id: Date.now(),
            type: 'text',
            content: 'New Text',
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000',
            bold: false,
            italic: false,
            underline: false,
            align: 'center',
            x: 10,
            y: 10,
            width: 80,
            height: 30
        };

        this.selectedLabel.elements.push(element);
        this.selectedElement = element;
        this.renderLabel(this.selectedLabel);
        this.updatePropertyPanel();
    }

    openImageUpload() {
        this.ensureSelectedLabel();

        // Store reference to selected label for later
        this.labelForImage = this.selectedLabel;
        document.getElementById('imageInput').click();
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Ensure there is a target label (fallback to stored or first)
        this.ensureSelectedLabel();
        let targetLabel = this.selectedLabel || this.labelForImage || this.labels[0];
        
        if (!targetLabel) {
            alert('No label selected');
            return;
        }

        const reader = new FileReader();
        const self = this;
        const savedLabel = targetLabel; // Save reference before async callback
        
        reader.onload = (event) => {
            const element = {
                id: Date.now(),
                type: 'image',
                src: event.target.result,
                x: 10,
                y: 10,
                width: 80,
                height: 80,
                opacity: 1
            };

            savedLabel.elements.push(element);
            self.selectedLabel = savedLabel;
            self.selectedElement = element;

            // Render the label with the new image
            self.renderLabel(savedLabel);

            // Update selection in DOM
            const labelEl = document.querySelector(`[data-label-id="${savedLabel.id}"]`);
            if (labelEl) {
                labelEl.classList.add('selected');
            }

            self.updatePropertyPanel();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }

    // Ensure there is always an active label selection
    ensureSelectedLabel() {
        if (!this.selectedLabel && this.labels.length > 0) {
            const firstLabel = this.labels[0];
            const firstLabelElement = document.querySelector(`[data-label-id="${firstLabel.id}"]`);
            if (firstLabelElement) {
                this.selectLabel(firstLabelElement, firstLabel);
            }
        }
    }

    deleteSelectedElement(silent = false) {
        if (!this.selectedLabel || !this.selectedElement) {
            if (!silent) alert('Please select an element to delete');
            return;
        }

        this.selectedLabel.elements = this.selectedLabel.elements.filter(
            el => el.id !== this.selectedElement.id
        );

        this.selectedElement = null;
        this.renderLabel(this.selectedLabel);
        this.updatePropertyPanel();
    }

    clearAllLabels() {
        if (confirm('Are you sure you want to clear all labels?')) {
            this.initializeLabels();
            this.selectedLabel = null;
            this.selectedElement = null;
            this.render();
            this.updatePropertyPanel();
        }
    }

    copyLabel() {
        if (!this.selectedLabel) {
            alert('Välj en etikett att kopiera');
            return;
        }

        // Deep copy the selected label
        this.copiedLabel = JSON.parse(JSON.stringify(this.selectedLabel));
        alert('Etikett kopierad! Välj en annan etikett och klicka "Klistra in etikett".');
    }

    copyToSelectedLabels() {
        if (!this.selectedLabel) {
            alert('Välj en källetikett att kopiera från');
            return;
        }
        if (this.selectedLabels.size <= 1) {
            alert('Markera flera etiketter först (håll Ctrl/Cmd och klicka eller dra med musen)');
            return;
        }

        const sourceLabel = this.selectedLabel;
        const targetLabels = Array.from(this.selectedLabels).filter(id => id !== sourceLabel.id);
        
        if (targetLabels.length === 0) {
            alert('Inga andra etiketter är markerade');
            return;
        }

        if (confirm(`Vill du kopiera innehållet från denna etikett till ${targetLabels.length} andra etiketter?`)) {
            targetLabels.forEach(labelId => {
                const targetLabel = this.labels.find(l => l.id === labelId);
                if (targetLabel) {
                    const clone = JSON.parse(JSON.stringify(sourceLabel));
                    const baseId = Date.now() + labelId * 1000;
                    clone.elements = clone.elements.map((el, idx) => ({
                        ...el,
                        id: baseId + idx
                    }));
                    targetLabel.elements = clone.elements;
                    targetLabel.backgroundColor = clone.backgroundColor;
                    this.renderLabel(targetLabel);
                }
            });
            alert(`Innehåll kopierat till ${targetLabels.length} etiketter!`);
        }
    }

    updateSelectionInfo() {
        const info = document.getElementById('selectionInfo');
        if (info) {
            const count = this.selectedLabels.size;
            if (count > 1) {
                info.textContent = `${count} etiketter markerade`;
                info.style.display = 'block';
            } else {
                info.style.display = 'none';
            }
        }
    }

    pasteLabel() {
        if (!this.selectedLabel) {
            alert('Välj en etikett att klistra in i');
            return;
        }
        if (!this.copiedLabel) {
            alert('Ingen etikett är kopierad ännu');
            return;
        }

        // Deep copy so we do not mutate the stored copy
        const clone = JSON.parse(JSON.stringify(this.copiedLabel));

        // Assign new ids to elements to keep uniqueness
        const baseId = Date.now();
        clone.elements = clone.elements.map((el, idx) => ({
            ...el,
            id: baseId + idx
        }));

        this.selectedLabel.elements = clone.elements;
        this.selectedLabel.backgroundColor = clone.backgroundColor;
        this.selectedElement = null;

        this.renderLabel(this.selectedLabel);
        this.updatePropertyPanel();
    }

    selectLabel(labelElement, labelData, addToSelection = false) {
        if (!addToSelection) {
            // Deselect previous
            document.querySelectorAll('.label').forEach(el => el.classList.remove('selected'));
            document.querySelectorAll('.label-element').forEach(el => el.classList.remove('selected'));
            this.selectedLabels.clear();
        }
        
        labelElement.classList.add('selected');
        this.selectedLabels.add(labelData.id);
        this.selectedLabel = labelData;
        this.selectedElement = null;
        this.updatePropertyPanel();
        this.updateSelectionInfo();
    }

    selectElement(elementEl, elementData, labelData = null) {
        if (labelData && this.selectedLabel !== labelData) {
            // select the label container first
            document.querySelectorAll('.label').forEach(el => el.classList.remove('selected'));
            const labelEl = document.querySelector(`.label[data-label-id="${labelData.id}"]`);
            if (labelEl) labelEl.classList.add('selected');
            this.selectedLabel = labelData;
        }

        if (!this.selectedLabel) return;

        document.querySelectorAll('.label-element').forEach(el => el.classList.remove('selected'));
        elementEl.classList.add('selected');

        this.selectedElement = elementData;
        this.updatePropertyPanel();
    }

    updateSelectedElement() {
        if (!this.selectedElement) return;

        if (this.selectedElement.type === 'text') {
            this.selectedElement.content = document.getElementById('textContent').value;
            this.selectedElement.fontFamily = document.getElementById('fontFamily').value;
            this.selectedElement.fontSize = parseInt(document.getElementById('fontSize').value);
            this.selectedElement.color = document.getElementById('textColor').value;
            this.selectedElement.bold = document.getElementById('boldText').checked;
            this.selectedElement.italic = document.getElementById('italicText').checked;
            this.selectedElement.underline = document.getElementById('underlineText').checked;
            
            const alignBtn = document.querySelector('.align-btn.active');
            if (alignBtn) {
                this.selectedElement.align = alignBtn.dataset.align;
            }
        } else if (this.selectedElement.type === 'image') {
            const opacityVal = parseInt(document.getElementById('imageOpacity').value, 10);
            this.selectedElement.opacity = Math.min(100, Math.max(0, isNaN(opacityVal) ? 100 : opacityVal)) / 100;
        }

        if (this.selectedLabel) {
            this.renderLabel(this.selectedLabel);
        }
    }

    updateLabelBackground() {
        if (!this.selectedLabel) return;

        this.selectedLabel.backgroundColor = document.getElementById('backgroundColor').value;
        this.renderLabel(this.selectedLabel);
    }

    updatePropertyPanel() {
        const panel = {
            textContent: document.getElementById('textContent'),
            fontFamily: document.getElementById('fontFamily'),
            fontSize: document.getElementById('fontSize'),
            fontSizeNumber: document.getElementById('fontSizeNumber'),
            textColor: document.getElementById('textColor'),
            backgroundColor: document.getElementById('backgroundColor'),
            boldText: document.getElementById('boldText'),
            italicText: document.getElementById('italicText'),
            underlineText: document.getElementById('underlineText'),
            imageOpacity: document.getElementById('imageOpacity'),
            imageOpacityNumber: document.getElementById('imageOpacityNumber')
        };

        // Reset all
        Object.values(panel).forEach(el => {
            if (el.type === 'checkbox') el.checked = false;
            else if (el.tagName === 'TEXTAREA') el.value = '';
            else el.value = el.id === 'backgroundColor' ? '#ffffff' : el.defaultValue || '';
        });

        // Update alignment buttons
        document.querySelectorAll('.align-btn').forEach(btn => btn.classList.remove('active'));

        if (this.selectedElement && this.selectedElement.type === 'text') {
            panel.textContent.value = this.selectedElement.content;
            panel.fontFamily.value = this.selectedElement.fontFamily;
            panel.fontSize.value = this.selectedElement.fontSize;
            panel.fontSizeNumber.value = this.selectedElement.fontSize;
            panel.textColor.value = this.selectedElement.color;
            panel.boldText.checked = this.selectedElement.bold;
            panel.italicText.checked = this.selectedElement.italic;
            panel.underlineText.checked = this.selectedElement.underline;

            const alignBtn = document.querySelector(`[data-align="${this.selectedElement.align}"]`);
            if (alignBtn) alignBtn.classList.add('active');
        } else if (this.selectedElement && this.selectedElement.type === 'image') {
            const op = Math.round((this.selectedElement.opacity ?? 1) * 100);
            panel.imageOpacity.value = op;
            panel.imageOpacityNumber.value = op;
        }

        if (this.selectedLabel) {
            panel.backgroundColor.value = this.selectedLabel.backgroundColor;
        }
    }

    setupElementDragAndResize(elementEl, elementData, labelData) {
        elementEl.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                // Resize mode
                this.resizingElement = elementData;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.dragStartLeft = elementData.width;
                this.dragStartTop = elementData.height;
                e.preventDefault();
            } else {
                // Drag mode
                const targetIsEditable = e.target.isContentEditable;
                this.draggingElement = elementData;
                this.draggingFromContentEditable = !!targetIsEditable;
                this.draggingActive = false;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.dragStartLeft = elementData.x;
                this.dragStartTop = elementData.y;
                if (!targetIsEditable) {
                    e.preventDefault();
                }
                
                this.selectElement(elementEl, elementData, labelData);
            }
        });
    }

    renderLabel(labelData) {
        const labelElement = document.querySelector(`[data-label-id="${labelData.id}"]`);
        if (!labelElement) return;

        // Update background
        labelElement.style.backgroundColor = labelData.backgroundColor;

        // Clear content
        const content = labelElement.querySelector('.label-content');
        content.innerHTML = '';

        // Render elements
        labelData.elements.forEach(element => {
            const elementEl = document.createElement('div');
            elementEl.className = 'label-element';
            elementEl.dataset.elementId = element.id;

            if (element === this.selectedElement) {
                elementEl.classList.add('selected');
            }

            if (element.type === 'text') {
                elementEl.classList.add('label-element-text');
                elementEl.style.left = element.x + 'px';
                elementEl.style.top = element.y + 'px';
                elementEl.style.width = element.width + 'px';
                elementEl.style.height = element.height + 'px';
                
                const textContent = document.createElement('div');
                textContent.contentEditable = true;
                textContent.textContent = element.content;
                textContent.style.fontSize = element.fontSize + 'px';
                textContent.style.fontFamily = element.fontFamily;
                textContent.style.color = element.color;
                textContent.style.textAlign = element.align;
                textContent.style.fontWeight = element.bold ? 'bold' : 'normal';
                textContent.style.fontStyle = element.italic ? 'italic' : 'normal';
                textContent.style.textDecoration = element.underline ? 'underline' : 'none';
                textContent.style.width = '100%';
                textContent.style.height = '100%';
                textContent.style.display = 'flex';
                textContent.style.alignItems = 'center';
                textContent.style.justifyContent = 'center';
                textContent.style.whiteSpace = 'pre-wrap';
                textContent.style.wordBreak = 'break-word';
                textContent.style.userSelect = 'text';
                textContent.style.outline = 'none';
                textContent.style.padding = '4px 8px';
                
                // Update model when text changes
                textContent.addEventListener('input', () => {
                    element.content = textContent.textContent;
                    if (this.selectedElement === element) {
                        document.getElementById('textContent').value = element.content;
                    }
                });
                
                // Handle focus and selection
                textContent.addEventListener('click', () => {
                    this.selectElement(elementEl, element, labelData);
                });
                
                textContent.addEventListener('mousedown', () => {
                    this.selectElement(elementEl, element, labelData);
                });
                
                elementEl.appendChild(textContent);

                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                elementEl.appendChild(resizeHandle);
            } else if (element.type === 'image') {
                const img = document.createElement('img');
                img.src = element.src;
                img.className = 'label-element-image';
                img.draggable = false;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';

                // Position the wrapper
                elementEl.style.left = element.x + 'px';
                elementEl.style.top = element.y + 'px';
                elementEl.style.width = element.width + 'px';
                elementEl.style.height = element.height + 'px';
                elementEl.style.opacity = (element.opacity ?? 1);
                
                // Select on interaction
                img.addEventListener('click', () => {
                    this.selectElement(elementEl, element, labelData);
                });
                img.addEventListener('mousedown', () => {
                    this.selectElement(elementEl, element, labelData);
                });
                
                elementEl.appendChild(img);

                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                elementEl.appendChild(resizeHandle);
            }

            content.appendChild(elementEl);
            this.setupElementDragAndResize(elementEl, element, labelData);
        });
    }

    render() {
        const grid = document.getElementById('labelGrid');
        const marginMiddle = grid.querySelector('.margin-middle');
        grid.innerHTML = '';
        
        // Re-add the margin-middle element if it existed
        if (marginMiddle) {
            grid.appendChild(marginMiddle);
        }

        this.labels.forEach(labelData => {
            const labelElement = document.createElement('div');
            labelElement.className = 'label';
            labelElement.dataset.labelId = labelData.id;
            
            const content = document.createElement('div');
            content.className = 'label-content';
            labelElement.appendChild(content);

            labelElement.addEventListener('mousedown', (e) => {
                if (e.target.closest('.label-element')) return;
                
                const isMultiSelect = e.ctrlKey || e.metaKey;
                
                // Store click info
                this.clickedLabel = { element: labelElement, data: labelData, isMultiSelect: isMultiSelect };
                this.isSelecting = true;
                this.selectionStartX = e.clientX;
                this.selectionStartY = e.clientY;
                this.hasDragged = false;
                
                e.preventDefault();
            });

            grid.appendChild(labelElement);
            this.renderLabel(labelData);
        });

        // Add global mouse move/up listeners
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Create selection box element
        if (!this.selectionBox) {
            this.selectionBox = document.createElement('div');
            this.selectionBox.className = 'selection-box';
            this.selectionBox.style.display = 'none';
            document.body.appendChild(this.selectionBox);
        }
    }

    onMouseMove(e) {
        if (this.isSelecting && !this.draggingElement && !this.resizingElement) {
            const currentX = e.clientX;
            const currentY = e.clientY;
            
            const deltaX = Math.abs(currentX - this.selectionStartX);
            const deltaY = Math.abs(currentY - this.selectionStartY);
            
            // Check if user has dragged more than threshold
            if (deltaX > 5 || deltaY > 5) {
                this.hasDragged = true;
                
                // Clear previous selection on first drag movement (unless Ctrl/Cmd is held)
                if (!this.hasStartedDrag && this.clickedLabel && !this.clickedLabel.isMultiSelect) {
                    document.querySelectorAll('.label').forEach(el => el.classList.remove('selected'));
                    this.selectedLabels.clear();
                }
                this.hasStartedDrag = true;
                
                const left = Math.min(this.selectionStartX, currentX);
                const top = Math.min(this.selectionStartY, currentY);
                const width = Math.abs(currentX - this.selectionStartX);
                const height = Math.abs(currentY - this.selectionStartY);
                
                this.selectionBox.style.display = 'block';
                this.selectionBox.style.left = left + 'px';
                this.selectionBox.style.top = top + 'px';
                this.selectionBox.style.width = width + 'px';
                this.selectionBox.style.height = height + 'px';
                
                // Check which labels intersect with selection box
                const selectionRect = {
                    left: left,
                    top: top,
                    right: left + width,
                    bottom: top + height
                };
                
                document.querySelectorAll('.label').forEach(labelEl => {
                    const rect = labelEl.getBoundingClientRect();
                    const intersects = !(rect.right < selectionRect.left || 
                                       rect.left > selectionRect.right || 
                                       rect.bottom < selectionRect.top || 
                                       rect.top > selectionRect.bottom);
                    
                    const labelId = parseInt(labelEl.dataset.labelId);
                    if (intersects) {
                        labelEl.classList.add('selected');
                        this.selectedLabels.add(labelId);
                    } else if (!this.clickedLabel || !this.clickedLabel.isMultiSelect) {
                        labelEl.classList.remove('selected');
                        this.selectedLabels.delete(labelId);
                    }
                });
                
                this.updateSelectionInfo();
            }
            return;
        }
        
        if (this.draggingElement) {
            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;
            
            // If dragging started from editable text and user is selecting text, do not move
            if (this.draggingFromContentEditable) {
                const selection = window.getSelection();
                if (selection && selection.toString().length > 0) {
                    return;
                }
            }

            // Do not move until a small threshold is passed to allow clicks/selection
            if (!this.draggingActive) {
                if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) {
                    return;
                }
                this.draggingActive = true;
            }

            this.draggingElement.x = this.dragStartLeft + deltaX;
            this.draggingElement.y = this.dragStartTop + deltaY;

            if (this.selectedLabel) {
                this.renderLabel(this.selectedLabel);
                this.checkCenterGuides();
            }
        } else if (this.resizingElement) {
            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;

            this.resizingElement.width = Math.max(30, this.dragStartLeft + deltaX);
            this.resizingElement.height = Math.max(30, this.dragStartTop + deltaY);

            if (this.selectedLabel) {
                this.renderLabel(this.selectedLabel);
            }
        }
    }

    checkCenterGuides() {
        if (!this.draggingElement || !this.selectedLabel) return;
        
        const labelElement = document.querySelector(`.label[data-label-id="${this.selectedLabel.id}"]`);
        const content = labelElement?.querySelector('.label-content');
        if (!content) return;

        const labelRect = content.getBoundingClientRect();
        const labelWidth = labelRect.width;
        const labelHeight = labelRect.height;
        
        // Center position of the element
        const elementCenterX = this.draggingElement.x + this.draggingElement.width / 2;
        const elementCenterY = this.draggingElement.y + this.draggingElement.height / 2;
        
        // Center of the label
        const labelCenterX = labelWidth / 2;
        const labelCenterY = labelHeight / 2;
        
        // Very tight tolerance - only show when very close (2 pixels)
        const tolerance = 2;
        
        const isNearCenterX = Math.abs(elementCenterX - labelCenterX) < tolerance;
        const isNearCenterY = Math.abs(elementCenterY - labelCenterY) < tolerance;
        
        // Remove both classes first
        content.classList.remove('show-vertical', 'show-horizontal');
        
        // Show guides based on alignment
        if (isNearCenterX && isNearCenterY) {
            // Both centered
            content.classList.add('show-vertical', 'show-horizontal');
            this.draggingElement.x = labelCenterX - this.draggingElement.width / 2;
            this.draggingElement.y = labelCenterY - this.draggingElement.height / 2;
        } else if (isNearCenterX) {
            // Only horizontally centered
            content.classList.add('show-vertical');
            this.draggingElement.x = labelCenterX - this.draggingElement.width / 2;
        } else if (isNearCenterY) {
            // Only vertically centered
            content.classList.add('show-horizontal');
            this.draggingElement.y = labelCenterY - this.draggingElement.height / 2;
        }
    }

    onMouseUp(e) {
        if (this.isSelecting) {
            this.isSelecting = false;
            this.selectionBox.style.display = 'none';
            
            // If user didn't drag, treat it as a click
            if (!this.hasDragged && this.clickedLabel) {
                const { element, data, isMultiSelect } = this.clickedLabel;
                this.selectLabel(element, data, isMultiSelect);
            } else if (this.hasDragged) {
                // Update selected label to last selected
                if (this.selectedLabels.size > 0) {
                    const lastSelectedId = Array.from(this.selectedLabels).pop();
                    this.selectedLabel = this.labels.find(l => l.id === lastSelectedId);
                }
            }
            
            this.clickedLabel = null;
            this.hasDragged = false;
            this.hasStartedDrag = false;
        }
        
        this.draggingElement = null;
        this.resizingElement = null;
        this.draggingFromContentEditable = false;
        this.draggingActive = false;
        
        // Hide guides
        if (this.selectedLabel) {
            const labelElement = document.querySelector(`.label[data-label-id="${this.selectedLabel.id}"]`);
            const content = labelElement?.querySelector('.label-content');
            if (content) {
                content.classList.remove('show-vertical', 'show-horizontal');
            }
        }
    }

    print() {
        window.print();
    }

    async downloadJSON() {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            labels: this.labels
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const defaultName = `etiketter_${new Date().toISOString().split('T')[0]}.json`;

        // Try native save dialog first (Chrome/Edge)
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: defaultName,
                    types: [
                        {
                            description: 'JSON',
                            accept: { 'application/json': ['.json'] }
                        }
                    ]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return;
            } catch (err) {
                if (err && err.name === 'AbortError') return; // user cancelled
            }
        }

        // Try backend file dialog (Firefox in EXE)
        try {
            const response = await fetch('/api/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: defaultName })
            });

            const result = await response.json();
            
            if (response.ok && result.path) {
                // User selected a path - write the file
                const saveResponse = await fetch('/api/write-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: result.path, data: json })
                });
                
                if (saveResponse.ok) {
                    console.log('File saved successfully');
                    return;
                }
            } else if (result.error === 'cancelled') {
                // User cancelled - don't do anything
                console.log('Save cancelled');
                return;
            }
        } catch (err) {
            // Backend not available - continue to other methods
            console.log('Backend not available, no file save dialog possible');
        }

        // Last resort: if nothing else worked, just return (no download)
        console.log('No file dialog available');
    }

    openLoadFile() {
        document.getElementById('loadInput').click();
    }

    handleLoadFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                this.labels = data.labels;
                this.selectedLabel = null;
                this.selectedElement = null;
                this.render();
                this.updatePropertyPanel();
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.selectedElement = null;
            this.selectedLabel = null;
            document.querySelectorAll('.label-element').forEach(el => el.classList.remove('selected'));
            document.querySelectorAll('.label').forEach(el => el.classList.remove('selected'));
            this.updatePropertyPanel();
            return;
        }

        if (e.key !== 'Delete' && e.key !== 'Backspace') return;

        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
            return;
        }

        this.deleteSelectedElement(true);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LabelEditor();
});
