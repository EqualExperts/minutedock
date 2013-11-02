require.config({
	baseUrl : 'js',
	paths : {
		'angular' : '//ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular.min',
		'angular-storage' : '//rawgithub.com/gsklee/ngStorage/master/ngStorage.min',
		'angular-bootstrap' : '//raw.github.com/angular-ui/bootstrap/gh-pages/ui-bootstrap-tpls-0.6.0',
		'http-auth-interceptor' : '//raw.github.com/witoldsz/angular-http-auth/master/src/http-auth-interceptor',
		'angular-cookies' : '//ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular-cookies.min'
	},
	shim : {
		'angular-storage' : {
			'exports' : 'angular-storage',
			'deps' : ['angular']	
		},
		'angular-bootstrap' : {
			'exports' : 'angular-bootstrap',
			'deps' : ['angular']	
		},
		'http-auth-interceptor' : {
			'exports' : 'http-auth-interceptor',
			'deps' : ['angular']	
		},
		'angular-cookies' : {
			'exports' : 'angular-cookies',
			'deps' : ['angular']	
		},
		'angular' : {
			'exports' : 'angular'
		}
	}
});

require(['angular','directives/authDirective','routes/loginRoutes','routes/entriesPageRoutes'], function(angular){
	angular.bootstrap(document, ['app']);
});