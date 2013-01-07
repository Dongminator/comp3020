import jinja2
import os
import webapp2

from webapp2 import WSGIApplication, Route
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app


jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates"))

class MainPage(webapp2.RequestHandler):
    def get(self):
#        template_values = {
#            'greetings': greetings,
#            'url': url,
#            'url_linktext': url_linktext,
#        }
        
        template_values = {}

        template = jinja_environment.get_template('login.html')
        self.response.out.write(template.render(template_values))

class HomePage(webapp2.RequestHandler):
    def get(self):
        template_values = {}

        template = jinja_environment.get_template('home.html')
        self.response.out.write(template.render(template_values))
# TODO: all the routes go here

app = WSGIApplication(
                      [('/', MainPage), 
                       ('/home', HomePage),
                       ('/login', MainPage)], debug=True)
