// After Effects Render Automation Script for Selected Comps with 00_Simulator Control and Name List Integration

// Function to find a composition by name
function findCompByName(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === name) {
            return item;
        }
    }
    return null;
}

// Function to get selected compositions
function getSelectedComps() {
    var selectedComps = [];
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.selected) {
            selectedComps.push(item);
        }
    }
    return selectedComps;
}

// Function to add composition to render queue
function addCompToRenderQueue(comp, outputModule, outputFile) {
    var item = app.project.renderQueue.items.add(comp);
    var output = item.outputModule(1);
    
    output.applyTemplate(outputModule);
    output.file = new File(outputFile);
    
    return item;
}

// Function to wait for rendering to complete
function waitForRender() {
    while (app.project.renderQueue.numItems > 0 && app.project.renderQueue.item(1).status == RQItemStatus.QUEUED) {
        $.sleep(1000); // Wait for 1 second before checking again
    }
}

// Function to get current dropdown index
function getCurrentDropdownIndex(dropdownEffect) {
    var menuProperty = dropdownEffect.property("Menu");
    if (menuProperty) {
        return menuProperty.value;
    }
    return null;
}

// Function to set dropdown index
function setDropdownIndex(dropdownEffect, index) {
    var menuProperty = dropdownEffect.property("Menu");
    if (menuProperty) {
        menuProperty.setValue(index);
    }
}

// Function to get text from layer by index
function getTextFromLayerByIndex(comp, index) {
    if (index > 0 && index <= comp.numLayers) {
        var layer = comp.layer(index);
        if (layer.property("Source Text")) {
            return layer.property("Source Text").value.text;
        }
    }
    return "";
}

// Function to create folder if it doesn't exist
function createFolderIfNotExists(folderPath) {
    var folder = new Folder(folderPath);
    if (!folder.exists) {
        folder.create();
    }
    return folder;
}

// Main function
function main() {
    try {
        var controlComp = findCompByName("00_Simulator");
        if (!controlComp) {
            alert("Error: Composition '00_Simulator' not found!");
            return;
        }

        var playerLayer = controlComp.layer("PLAYER TO RENDER");
        if (!playerLayer) {
            alert("Error: Layer 'PLAYER TO RENDER' not found in '00_Simulator'!");
            return;
        }

        var dropdownEffect = playerLayer.effect("DROPDOWN");
        if (!dropdownEffect) {
            alert("Error: Effect 'DROPDOWN' not found on 'PLAYER TO RENDER' layer!");
            return;
        }

        var currentIndex = getCurrentDropdownIndex(dropdownEffect);

        var selectedComps = getSelectedComps();
        if (selectedComps.length === 0) {
            alert("Error: No compositions selected. Please select at least one composition to render.");
            return;
        }

        var nameListComp = findCompByName("NAME LIST");
        if (!nameListComp) {
            alert("Error: Composition 'NAME LIST' not found!");
            return;
        }

        var firstNameListComp = findCompByName("FIRSTNAME LIST");
        var lastNameListComp = findCompByName("LASTNAME LIST");
        var numberListComp = findCompByName("NUMBERLIST - NEW");

        if (!firstNameListComp || !lastNameListComp || !numberListComp) {
            alert("Error: One or more of the required name list compositions not found!");
            return;
        }

        var numMenuItems = 47;  // Assuming there are 46 items as mentioned earlier
        var startIndex = parseInt(prompt("Enter the starting index (1-" + numMenuItems + "):", "1"));
        var endIndex = parseInt(prompt("Enter the ending index (1-" + numMenuItems + "):", numMenuItems.toString()));
        
        if (isNaN(startIndex) || isNaN(endIndex) || startIndex > endIndex || startIndex < 1 || endIndex > numMenuItems) {
            alert("Error: Invalid index range!");
            return;
        }

        var outputModule = "LHF-FINAL";
        var outputFolder = Folder.selectDialog("Choose the output folder");
        
        if (!outputFolder) {
            alert("Error: No output folder selected");
            return;
        }

        // Loop through the selected range
        for (var i = startIndex; i <= endIndex; i++) {
            // Clear render queue
            while (app.project.renderQueue.numItems > 0) {
                app.project.renderQueue.item(1).remove();
            }

            // Set the dropdown value
            setDropdownIndex(dropdownEffect, i);
            
            // Get name components
            var firstName = getTextFromLayerByIndex(firstNameListComp, i);
            var lastName = getTextFromLayerByIndex(lastNameListComp, i);
            var number = getTextFromLayerByIndex(numberListComp, i);
            
            // Create folder name
            var folderName = number + "_" + firstName + "_" + lastName;
            var renderFolder = createFolderIfNotExists(outputFolder.fsName + "/" + folderName);
            
            // Add all selected compositions to render queue
            for (var j = 0; j < selectedComps.length; j++) {
                var comp = selectedComps[j];
                var outputFile = new File(renderFolder.fsName + "/" + comp.name + "_Option" + i + ".mov");
                addCompToRenderQueue(comp, outputModule, outputFile);
            }

            // Start rendering
            if (app.project.renderQueue.numItems > 0) {
                app.project.renderQueue.render();
                waitForRender(); // Wait for rendering to complete
            }
        }

        // Restore the original dropdown index
        setDropdownIndex(dropdownEffect, currentIndex);

        alert("Rendering completed successfully!");
    } catch (error) {
        alert("Error in script: " + error.toString());
    }
}

// Run the script
main();