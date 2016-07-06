#!/usr/bin/python
import cgi
# cgitb to provide debugging info 
import cgitb
cgitb.enable()
import sys

print ('Content-type: text/html') 
print ('')
# note the empty print line above is required!
print ('<HTML><HEAD><TITLE>Python Test</TITLE></HEAD>') 
print ('<BODY>') 
print ('Running Python via CGI. version: ')
print (sys.version)
print ('<HR>')
print ('Request arguments:') 
print ('<ol>')
theRequest = cgi.FieldStorage()
for KV in theRequest:
	print ('<li>')
	print (KV + ' = ' + theRequest[KV].value)
	print ('</li>')
print ('</ol>') 
print ('</BODY></HTML>')
