window.P = {};
P.asyncLoad = function(pluginsList) {
	for (var i in pluginsList) {
		var namespace = pluginsList[i][0],
			src = pluginsList[i][1];

		this[namespace] = {
			namespace: namespace,
			src: src,
			isLoaded: false,
			loaded: function() {
				console.log('P:loaded[' + this.namespace + ']', this.queue);
				this.isLoaded = true;
				this.run();
			},
			queue: [],
			run: function() {
				var task;
				if (this.isLoaded && !this.isRunning) {
					this.isRunning = true;
					while (this.queue.length > 0) {
						task = this.queue.shift();
						if (typeof task === 'function') task();
					}
					this.isRunning = false;
				}
			},
			isRunning: false,
			addToQueue: function(what) {
				this.queue.push(what);
				this.run();
			},
			ready: function(what) {
				this.queue.push(what);
				this.run();
			},
			init: function(defaultQueue) {
				if (typeof defaultQueue === 'undefined') defaultQueue = [];
				if (typeof defaultQueue === 'function') defaultQueue = [defaultQueue];
				this.queue = this.queue.concat(defaultQueue);

				var s = document.createElement('script'),
					r = false,
					t;
				s.type = 'text/javascript';
				s.src = this.src;
				s.setAttribute('data-namespace', this.namespace);
				//s.onload = P[this.namespace].loaded();
				s.onload = function() {
					var namespace = this.getAttribute('data-namespace');
					P[namespace].loaded();
				};
				t = document.getElementsByTagName('script')[0];
				t.parentNode.insertBefore(s, t);
			},
		};
	}
};

P.asyncLoad([
	['jquery', 'js/jquery-3.2.1.min.js'],
	['login', 'js/login.js'],
	['forms', 'https://pdrcontractors.com/cms/modules/forms/js/forms.js'],
	['sweetalert', 'https://pdrcontractors.com/cms/plugins/sweetalert2/dist/sweetalert2.all.min.js'],
	['mapbox', 'https://api.mapbox.com/mapbox.js/v3.2.0/mapbox.js'],
	['mapbox-cluster', 'https://pdrcontractors.com/js/Leaflet.markercluster-1.4.1/dist/leaflet.markercluster-src.js'],
	['template7', 'js/template7.min.js'],
	['moment', 'js/moment.js'],
	['fancybox', 'https://pdrcontractors.com/cms/plugins/fancybox-master/dist/jquery.fancybox.min.js'],
]);

var cms = {};

P.jquery.init(function() {
	P.login.init();
	P.forms.init();
	P.sweetalert.init();
	P.template7.init();
	P.moment.init();
	P.fancybox.init();
});
