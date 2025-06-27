class EventEmitter {
    /**@type {Object.<string, ((...any) => any)[]>} */
    #listener = {}


    /**
     * @callback listenerCallBack
     * @param {...any} args
     * @returns {any}
     */


    /**
     * 
     * @param {string} eventName 
     * @param {listenerCallBack} callback 
     */
    addListener(eventName, callback) {
        if (typeof eventName != "string") return;
        if (typeof callback != "function") return;
        const l = (() => {
            
        })();
        return callback;
    }


    /**
     * 
     * @param {string} eventName 
     * @param {listenerCallBack} callback 
     */
    removeListener(eventName, callback) {

    }

    on = this.addListener;

    /**
     * 
     * @param {string} eventName 
     * @param {listenerCallBack} callback 
     */
    once(eventName, callback) {

    }
}