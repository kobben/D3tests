#!/usr/bin/python
import psycopg2

print ('Content-type: text/csv')
print ('')
# note the empty print line above is required!


# Get a database connection (a pgobject) for our database:
db = psycopg2.connect(database='studentmapper',host='localhost',user='studentmapper',
           password='studentmapper', port=5432)

# Get a cursor to be used:
mycursor = db.cursor()

# Query the database
mycursor.execute("SELECT id, name, country, lon, lat \
                   FROM students \
                   LIMIT 1000;")

# Get the results:
queryresult = mycursor.fetchall()

print ('id,name,country,lon,lat')

# cycle over the results
for (id, name, country, lon, lat ) in queryresult:
    print (str(id) + ',' + name + ',' + country + ',' + str(lon) + ',' + str(lat) )

db = None
