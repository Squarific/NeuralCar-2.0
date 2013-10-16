var SQUARIFIC = SQUARIFIC || {};

SQUARIFIC.settings = {};
SQUARIFIC.settings.templates = {};

SQUARIFIC.settings.init = function initSettings (settings, goButtonText, cb) {
	settings = JSON.parse(JSON.stringify(settings));
	var div = document.createElement("div");
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
				returnSettings[settingName] = settingOptions.element.value;
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
			SQUARIFIC.settings.templates[settingOptions.type](settingOptions, settingName, cb);
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

SQUARIFIC.settings.templates.switch = function (settingOptions, settingName, cb) {
	
};

SQUARIFIC.settings.templates.numberArray = function (settingOptions, settingName, cb) {
	
};