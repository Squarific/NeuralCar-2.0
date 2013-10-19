var SQUARIFIC = SQUARIFIC || {};

SQUARIFIC.settings = {};
SQUARIFIC.settings.templates = {};

SQUARIFIC.settings.init = function initSettings (settings, goButtonText, cb) {
	settings = JSON.parse(JSON.stringify(settings));
	var div = document.createElement("div");
	var button = document.createElement("div");
	button.className = "settings-gobutton";
	button.appendChild(document.createTextNode(goButtonText));
	button.addEventListener("click", function (settings, event) {
		var returnSettings = {};
		function setValues (returnSettings, settingName, settingOptions) {
			if (!settingOptions.type || settingOptions.category) {
				returnSettings[settingName] = {}
				for (var settingNameKey in settingOptions) {
					if (settingNameKey !== "category") {
						setValues(returnSettings[settingName], settingNameKey, settingOptions[settingNameKey]);
					}
				}
			} else {
				if (settingOptions.element) {
					if (typeof settingOptions.element.getValue === "function") {
						returnSettings[settingName] = settingOptions.element.getValue();
					} else {
						returnSettings[settingName] = settingOptions.element.value;
					}
				}
			}
		}
		for (var settingName in settings) {
			if (settingName !== "category") {
				setValues(returnSettings, settingName, settings[settingName]);
			}
		}
		console.log(returnSettings);
		this(returnSettings);
	}.bind(cb, settings));
	div.appendChild(button);
	var main = document.createElement("div");
	main.className = "category";
	main.appendChild(document.createTextNode("settings"));
	div.appendChild(main)
	for (var settingName in settings) {
		if (!settings[settingName].type || settings[settingName].category) {
			div.appendChild(SQUARIFIC.settings.returnDivOfSetting(settings[settingName], settingName, cb, "settings."));
		} else {
			main.appendChild(SQUARIFIC.settings.returnDivOfSetting(settings[settingName], settingName, cb, "settings."));
		}
	}
	return div;
};

SQUARIFIC.settings.returnDivOfSetting = function returnDivOfSetting (settingOptions, settingName, cb, parent) {
	var settings = document.createElement("div");
	if (!settingOptions.type || settingOptions.category) {
		settings.classList.add("category");
		settings.appendChild(document.createTextNode((parent || "") + settingName));
		for (var settingNameKey in settingOptions) {
			if (settingNameKey === "category") {
				continue;
			}
			settings.appendChild(SQUARIFIC.settings.returnDivOfSetting(settingOptions[settingNameKey], settingNameKey, cb, (parent || "") + settingName + "."));
		}
	} else {
		if (SQUARIFIC.settings.templates[settingOptions.type]) {
			SQUARIFIC.settings.templates[settingOptions.type](settingOptions, settingName, cb, parent, settings);
		} else {
			settings.classList.add("setting");
			
			var name = document.createElement("div");
			name.appendChild(document.createTextNode((parent || "") + settingName));
			name.classList.add("setting-name");
			name.classList.add("setting-name-" + settingName);
			
			var input = document.createElement(settingOptions.tag || "input");
			input.settingName = settingName;
			input.classList.add("setting-input");
			input.classList.add("setting-input-" + settingName);
			for (var option in settingOptions) {
				input[option] = settingOptions[option];
			}
			settingOptions.element = input;
			
			var help = document.createElement("div");
			help.appendChild(document.createTextNode(settingOptions.help));
			help.classList.add("setting-help");
			help.classList.add("setting-help-" + settingName);
			
			settings.appendChild(name);
			settings.appendChild(input);
			settings.appendChild(help)
		}
	}
	return settings;
};

SQUARIFIC.settings.templates.switch = function (settingOptions, settingName, cb, parent, settingsDiv) {
	settingsDiv.classList.add("setting");
	
	var name = document.createElement("div");
	name.appendChild(document.createTextNode((parent || "") + settingName));
	name.classList.add("setting-name");
	name.classList.add("setting-name-" + settingName);
	
	var input = document.createElement(settingOptions.tag || "div");
	input.settingName = settingName;
	input.classList.add("setting-input");
	input.classList.add("setting-input-switch");
	input.classList.add("setting-input-" + settingName);
	input.innerHTML = settingOptions.value ? "On" : "Off";
	settingOptions.value ? input.classList.add("on") : input.classList.remove("on");
	for (var option in settingOptions) {
		input[option] = settingOptions[option];
	}
	input.addEventListener("click", function (event) {
		event.target.value = !event.target.value;
		input.innerHTML = event.target.value ? "On" : "Off";
		event.target.value ? input.classList.add("on") : input.classList.remove("on");
	});
	settingOptions.element = input;
	
	var help = document.createElement("div");
	help.appendChild(document.createTextNode(settingOptions.help));
	help.classList.add("setting-help");
	help.classList.add("setting-help-" + settingName);
	
	settingsDiv.appendChild(name);
	settingsDiv.appendChild(input);
	settingsDiv.appendChild(help)
};

SQUARIFIC.settings.templates.array = function (settingOptions, settingName, cb, parent, settingsDiv) {
	settingsDiv.classList.add("setting");
	
	var name = document.createElement("div");
	name.appendChild(document.createTextNode((parent || "") + settingName));
	name.classList.add("setting-name");
	name.classList.add("setting-name-array");
	name.classList.add("setting-name-" + settingName);
	
	var input = document.createElement(settingOptions.tag || "div");
	input.settingName = settingName;
	input.classList.add("setting-input-array-container");
	input.classList.add("setting-input-" + settingName);
	for (var option in settingOptions) {
		if (option === "value") {
			for (var k = 0; k < settingOptions.value.length; k++) {
				var inputValue = document.createElement("input");
				inputValue.type = settingOptions.arrayType;
				inputValue.value = settingOptions.value[k];
				inputValue.classList.add("setting-input");
				inputValue.classList.add("setting-input-array");
				input.appendChild(inputValue);
				
				var remove = document.createElement("div");
				remove.appendChild(document.createTextNode("X"));
				remove.classList.add("setting-input");
				remove.classList.add("setting-input-array-remove");
				remove.addEventListener("click", function (event) {
					this.parentNode.removeChild(this);
					event.target.parentNode.removeChild(event.target);
				}.bind(inputValue));
				input.appendChild(remove);
			}
		} else {
			input[option] = settingOptions[option];
		}
	}
	settingOptions.element = input;
	
	input.getValue = function getValue () {
		var values = [];
		for (var key in this.children) {
			if (this.children[key].value) {
				values.push(this.children[key].value);
			}
		}
		return values;
	}.bind(input);
	
	var addButton = document.createElement("div");
	addButton.appendChild(document.createTextNode("Add"));
	addButton.classList.add("setting-input-array-addButton");
	addButton.addEventListener("click", function (settingOptions, event) {
		var input = document.createElement("input");
		input.type = settingOptions.arrayType;
		input.value = 1;
		input.classList.add("setting-input");
		input.classList.add("setting-input-array");
		this.appendChild(input);
		
		var remove = document.createElement("div");
		remove.appendChild(document.createTextNode("X"));
		remove.classList.add("setting-input");
		remove.classList.add("setting-input-array-remove")
		remove.addEventListener("click", function (event) {
			this.parentNode.removeChild(this);
			event.target.parentNode.removeChild(event.target);
		}.bind(input));
		this.appendChild(remove);
	}.bind(input, settingOptions));
	
	var help = document.createElement("div");
	help.appendChild(document.createTextNode(settingOptions.help));
	help.classList.add("setting-help");
	help.classList.add("setting-help-" + settingName);
	
	settingsDiv.appendChild(name);
	settingsDiv.appendChild(input);
	settingsDiv.appendChild(addButton);
	settingsDiv.appendChild(help)
};