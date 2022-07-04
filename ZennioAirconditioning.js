/** 
 * Simple handler for Zennio airconditioning controllers
 * @author Martijn Dierckx
 */
/* jshint esversion: 6, strict: true, node: true */

'use strict';
/**
 * @type {HandlerPattern}
 */
var HandlerPattern = knxRequire( './lib/addins/handlerpattern.js' );
var log = knxRequire('debug')('ZennioAirconditioning');

/**
 * @class A custom handler for the Zennio airconditioning controller 
 * @extends HandlerPattern
 */
class ZennioAirconditioning extends HandlerPattern {

	onKNXValueChange(field, oldValue, knxValue) {		
        
        log("INFO: onKNXValueChange(" + field + ", "+ oldValue + ", "+ knxValue+ ")");
        
        // Helper func: Translate KNX Mode code to Homekit mode code
        var that = this;
        var setMode = function(characteristic, val) {
            switch(val) {
                case 0: // Automatic
                    if(characteristic == "TargetHeatingCoolingState") { that.myAPI.setValue(characteristic, 3); }
                    break;
                case 1: // Heating
                    that.myAPI.setValue(characteristic, 1);
                    break;
                case 3: // Cooling
                    that.myAPI.setValue(characteristic, 2);
                    break;
                case 9: // Fan
                    // Homekit doesn't handle this state. Faking cooling state.
                    that.myAPI.setValue(characteristic, 2);
                    break;
                case 14: //Dry
                    // Homekit doesn't handle this state. Faking heating state.
                    that.myAPI.setValue(characteristic, 1);
                    break;
            }
        }

        //Helper func: Determine wheter the AC is currently cooling/heating
        var setTargetHeatingCoolingState = function(currentTemp, targetTemp) {
            var isOn = that.myAPI.getValue("On/Off");
            var currentHeatingCoolingState = that.myAPI.getValue("CurrentHeatingCoolingState");

            if(currentTemp == targetTemp || !isOn) {
                that.myAPI.setValue("CurrentHeatingCoolingState", 0); // Off
            }
            else if(currentTemp <= targetTemp || currentHeatingCoolingState == 1 /* Heating */ || currentHeatingCoolingState == 9 /* Fan */) {
                that.myAPI.setValue("CurrentHeatingCoolingState", 1); // Heating
            }
            else {
                that.myAPI.setValue("CurrentHeatingCoolingState", 2); // Cooling
            }
        }

        // which GA has been changed?
		switch(field) {

            case "TargetHeatingCoolingState":
                setMode("TargetHeatingCoolingState", knxValue);
                break;
            
            case "CurrentHeatingCoolingState":
                setMode("CurrentHeatingCoolingState", knxValue);
                break;

            case "On/Off":
                if(knxValue) {
                    var modeStatus = this.myAPI.getValue("CurrentHeatingCoolingState");
                    setMode("CurrentHeatingCoolingState", modeStatus);
                    setMode("TargetHeatingCoolingState", modeStatus);
                }
                else {
                    this.myAPI.setValue("CurrentHeatingCoolingState", 0);
                    this.myAPI.setValue("TargetHeatingCoolingState", 0);
                }
                break;

            case "CurrentTemperature":
                this.myAPI.setValue("CurrentTemperature", knxValue);
                setTargetHeatingCoolingState(knxValue, this.myAPI.getValue("TargetTemperature"));
                break;
            
            case "TargetTemperature":
                this.myAPI.setValue("TargetTemperature", knxValue);
                setTargetHeatingCoolingState(this.myAPI.getValue("CurrentTemperature", knxValue));
                break;
		}

	}
	
	onHKValueChange(field, oldValue, newValue) {
        
        log("INFO: onHKValueChange(" + field + ", "+ oldValue + ", "+ newValue + ")");

        // Helper func: Translate Homekit mode code to KNX Mode code
        var that = this;
        var setMode = function(val){
            switch(val) {
                case 0: // Off
                    that.myAPI.knxWrite("On/Off", 0, "DPT1"); // Off
                    break;
                case 1: // Heating
                    that.myAPI.knxWrite("On/Off", 1, "DPT1"); // On
                    that.myAPI.knxWrite("TargetHeatingCoolingState", 1, "DPT5"); // Heating
                    break;
                case 2: // Cooling
                    that.myAPI.knxWrite("On/Off", 1, "DPT1"); // On
                    that.myAPI.knxWrite("TargetHeatingCoolingState", 3, "DPT5"); // Cooling
                    break;
                case 3: // Automatic
                    that.myAPI.knxWrite("On/Off", 1, "DPT1"); // On
                    that.myAPI.knxWrite("TargetHeatingCoolingState", 0, "DPT5"); // Automatic
                    break;
            }
        }
        
        switch(field) {
            case "CurrentHeatingCoolingState":
                // Nothing needs to be changed?
                break;

            case "TargetHeatingCoolingState":
                setMode(newValue);
                break;

            case "CurrentTemperature":
                // Nothings needs to be changed?
                break;
            
            case "TargetTemperature":
                this.myAPI.knxWrite("TargetTemperature", newValue, "DPT9");
                break;
        }
		
    }

} // class
module.exports = ZennioAirconditioning;


/* **********************************************************************************************************************
 *
 * Example config
 * 
"Services": [{
	"ServiceType": "Thermostat",
	"Handler": "ZennioAirconditioning",
	"ServiceName": "Airco",
	"Characteristics": [{
		"Type": "TargetHeatingCoolingState",
		"Set": "3/0/8",
		"Listen": ["3/0/8", "3/1/8"],
		"DPT": "DPT5"
    },
    {
		"Type": "CurrentHeatingCoolingState",
		"Set": "3/1/8",
		"Listen": "3/1/8",
		"DPT": "DPT5"
	},
	{
		"Type": "TargetTemperature",
		"Set": "3/4/8",
		"Listen": "3/4/8",
		"DPT": "DPT9"
    },
    {
		"Type": "CurrentTemperature",
		"Set": "3/5/9",
		"Listen": "3/5/8",
		"DPT": "DPT9"
	}],
	"KNXObjects": [{
		"Type": "On/Off",
        "Set": "3/2/8",
        "Listen": "3/3/8",
		"DPT": "DPT1"
	}]
}]
 * 
 * 
 * 
 */
