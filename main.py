import jinja2
import os
import webapp2
import json

from webapp2 import WSGIApplication, Route
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from compiler.ast import IfExp
from symbol import if_stmt


jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates"))

class User(db.Model):
    """Models an individual Guestbook entry with an author, content, and date."""
    userInfo = db.StringProperty()
    route = db.TextProperty()
  
  
class SNMap (db.Model):  
    snId = db.StringProperty()
    snName = db.StringProperty()
    snOtherInfo = db.StringProperty()
    user = db.ReferenceProperty(User)
    
    
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
    
class Store(webapp2.RequestHandler): 
    def post(self):
        postOption = self.request.get('postOption');
        
        if postOption == "connect" :
            sNId = self.request.get('sNId')
            sNName = self.request.get('sNName')
            
            # check if user has record in the database
            sNMap = db.GqlQuery("SELECT * FROM SNMap WHERE snId = :1 AND snName = :2", sNId, sNName)
            
            if not sNMap.count():
                # Do nothing
                # Create new user.
                user = User()
                user.route = '[]'
                user.put()
                
                sNEntry = SNMap(snId=sNId, snName=sNName, user = user)
                sNEntry.put()
                
            
        elif postOption == "route" :
            sNId = self.request.get('sNId')
            sNName = self.request.get('sNName')
            
            start_place = self.request.get('start_place')
            end_place = self.request.get('end_place')
            via_photos_ids = self.request.get('via_photos_ids')
#            via_places = self.request.get('via_places')
            
#            self.response.out.write(start_place)
#            self.response.out.write(end_place)
            
#            self.response.out.write(via_places)
            
            sNMap = db.GqlQuery("SELECT * FROM SNMap WHERE snId = :1 AND snName = :2", sNId, sNName)


            if sNMap.count():
                
                for sNEntry in sNMap:
                    user = sNEntry.user
                    
#                    json.dump(route)
#                    route.append(via_photos_ids)
                    
                    self.response.out.write(via_photos_ids)
                    
                    user.route = via_photos_ids
                    user.put()
            else :
                self.response.out.write("false")

        else:
            print 'More'
        
        # store ids and places
        
        # try to find SN id and SN name
        # if none returned -> create new one.
        # else update. 
        
        # need to find the key
#        socialApiIdEntry = SNMap(snId=sNId, snName=sNName)
#        user = User(route="")
#        
#        
#        # userSN_id: "000", socialApi : "facebook",  start_place : "start address", end_place : "end address", via_photos_ids : send1, via_places: send2
#        
#        user.put()
#        socialApiIdEntry.put()
        
class Route(webapp2.RequestHandler): 
    def post(self):
        sNId = self.request.get('sNId')
        sNName = self.request.get('sNName')
        
        sNMap = db.GqlQuery("SELECT * FROM SNMap WHERE snId = :1 AND snName = :2", sNId, sNName)
        
        if sNMap.count():
            for sNEntry in sNMap:
                user = sNEntry.user
                route = user.route
                
                self.response.out.write(route)
        else :
            self.response.out.write("false")
            

app = WSGIApplication(
                      [('/', MainPage), 
                       ('/home', HomePage),
                       ('/login', MainPage),
                       ('/store', Store),
                       ('/allRoute', Route)], debug=True)
