import os
import sys
import subprocess
import time




def usage():
	print ":("

def main():
	if len(sys.argv) == 1:
		usage()
		sys.exit()
		
	openSSLPath = "C:\\play\\openssl\\bin\\openssl.exe"
	inputFile = sys.argv[1]
	commandLine = '%s enc -aes-256-cbc -in %s -out outfile -pass pass:"secret key" -e -base64' % (openSSLPath, inputFile)
	
	
	subprocess.Popen("copy %s %s.backup" %(inputFile, inputFile), shell=True)
	proc = subprocess.Popen(commandLine, shell=True)
	
	

	while proc.poll() == None:
		time.sleep(0.1)

	
	encryptedData = open("outfile", "rb").readlines()
	
	finalFile = "{{{PFE:"
	for line in encryptedData:
		finalFile += line.strip()
		
	finalFile += "}}}"
	f = open(inputFile, "wb")
	f.write(finalFile)
	f.close()
		
		
if __name__ == "__main__":
	main()
