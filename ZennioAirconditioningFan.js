/** 
 * Simple handler for Zennio airconditioning controllers, specifically for the fan
 * @author Martijn Dierckx
 */
/* jshint esversion: 6, strict: true, node: true */

'use strict';
/**
 * @type {HandlerPattern}
 */
var HandlerPattern = knxRequire( './lib/addins/handlerpattern.js' );
var log = knxRequire('debug')('ZennioAirconditioningFan');

/**
 * @class A custom handler for the Zennio airconditioning controller, specifically for the fan
 * @extends HandlerPattern
 */
class ZennioAirconditioningFan extends HandlerPattern {

	onKNXValueChange(field, oldValue, knxValue) {		
        
        log("INFO: onKNXValueChange(" + field + ", "+ oldValue + ", "+ knxValue+ ")");

        // which GA has been changed?
		switch(field) {
            case "Active":
                this.myAPI.setValue("Active", knxValue);
                break;
            
            case "TargetFanState":
                this.myAPI.setValue("TargetFanState", knxValue);
                break;

            case "RotationSpeed":
                // Convert DPT to percentage
                var newValue = knxValue*100/255;
                this.myAPI.setValue("RotationSpeed", newValue);

                break;
		}
	}
	
	onHKValueChange(field, oldValue, newValue) {

        log("INFO: onHKValueChange(" + field + ", "+ oldValue + ", "+ knxValue+ ")");
        
        switch(field) {
            case "Active":
                this.myAPI.knxWrite("Active", newValue, "DPT1");
                break;

            case "TargetFanState":
                this.myAPI.knxWrite("TargetFanState", newValue, "DPT1");
                break;

            case "RotationSpeed":
                var knxValue = newValue*255/100;
                this.myAPI.knxWrite("RotationSpeed", knxValue, "DPT5");
                break;
        }

    }

} // class
module.exports = ZennioAirconditioningFan;


/* **********************************************************************************************************************
 *
 * Example config
 * 
"Services": [{
	"ServiceType": "Fanv2",
	"Handler": "ZennioAirconditioningFan",
	"ServiceName": "Airco - Fan",
	"Characteristics": [{
		"Type": "Active",
		"Set": "3/2/8",
		"Listen": "3/3/8",
		"DPT": "DPT1"
	},
	{
		"Type": "TargetFanState",
		"Set": "3/6/28",
		"Listen": "3/7/28",
		"DPT": "DPT1"
    },
    {
		"Type": "RotationSpeed",
		"Set": "3/6/8",
		"Listen": "3/7/8",
		"DPT": "DPT5.001"
	}]
}]
 * 
 * 
 * 
 */
