/*!
 * @license RequireJS Locate Plugin, Copyright (c) 2013 Ates Goral
 * @version 0.0.1
 * Implements the Service Locator pattern through a RequireJS plugin
 */
define(function () {
    var registry = {};

    return {
        load: function (name, req, onload, config) {
            if (name === "registry") {
                return onload({
                    register: function (name, service, isModuleId) {
                        isModuleId = isModuleId || false;
                        var services = registry[name] || (registry[name] = []);
                        services.push({
                            module: service,
                            isModuleId: isModuleId
                        });
                        return this; // todo: or return an unregister handle?
                    },
                    unregister: function (name, service) {
                        // todo
                    }
                });
            }

            var tokens = name.split("?"),
                services;

            if (tokens.length === 1) {
                services = registry[name];

                if (services.length === 1) {
                    var service = services[0];
                    if (service.isModuleId) {
                        req([service.module], function(module) {
                            services[0].isModuleId = false;
                            services[0].module = module;
                            onload(module);
                        });
                    } else {
                        onload(service.module);
                    }
                } else {
                    var err = new Error("Exactly one service instance expected");
                    err.locateServiceName = name;
                    err.locateActualCount = services.length;
                    onload.error(err);
                }
            } else {
                services = registry[tokens[0]];
                var notLoaded = 0;
                var serviceModules = [];
                for (var i = 0; i < services.length; i++) {
                    if (services[i].isModuleId) {
                        notLoaded++;
                        loadModule(i);
                        
                        function loadModule(i) {
                            req([services[i].module], function(module) {
                                services[i].isModuleId = false;
                                services[i].module = module;
                                serviceModules.push(services[i].module);
                                
                                notLoaded--;
                            });
                        }
                    } else {
                        serviceModules.push(services[i].module);
                    }
                }
                
                var checkLoaded = function() {
                    if (notLoaded > 0) {
                        setTimeout(checkLoaded, 0);
                        return;
                    }
                    
                    onload(serviceModules);
                };
                
                if (notLoaded > 0) {
                    checkLoaded();
                } else {
                    // todo: add filtering by query in tokens[1]
                    onload(serviceModules);
                }
            }
        }
    };
});
