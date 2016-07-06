#!/usr/bin/python
import cgi
# cgitb to provide debugging info
import cgitb
cgitb.enable()
# The psycopg2 package gives us classes psycopg2 and cursor:
import psycopg2

print('Content-type: text/html')
print('')
# note the undefined print line above is required!
print ('<html><head>')
#but this does not work: 
#print ('<meta charset="utf-8">')
print ('</head><body>')
#print ('</head><body onload="window.location=\'index.html\'">')

# Get a database connection (a pgobject) for our database:
db = psycopg2.connect(database='studentmapper',host='localhost',user='studentmapper',
           password='studentmapper', port=5432)

# Get a cursor to be used:
mycursor = db.cursor()


theRequest = cgi.FieldStorage()
name = theRequest.getfirst("name", "undefined")
country = theRequest.getfirst("country", "undefined")
lon = theRequest.getfirst("lon", "undefined")
lat = theRequest.getfirst("lat", "undefined")


# make update query from variables
queryStr = "INSERT INTO students (name, country, lon, lat) VALUES ('%s', '%s', %s, %s);" % (name, country, lon, lat)

print (queryStr)

try:
  mycursor.execute(queryStr)
except Exception as e:
  print('<hr />' + e.pgerror + '<hr />')

# close DB cursor, commit changes and close DB connection:
mycursor.close()
db.commit()
db.close()

print ('<br><a href="index.html">Go on...</a> ')
print ('</body></html>')