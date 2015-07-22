NAME?=$(shell basename `pwd`)
ZIPFILE:=$(shell mktemp -q /tmp/${NAME}.XXXXXX).zip

default:
	# Target: deploy - push code to AWS
	# Target: grammar - generate grammar and copy to clipboard

all: deploy grammar

deploy:
	zip -r '${ZIPFILE}' * 
	aws lambda update-function-code --function-name ${NAME} --zip-file fileb://${ZIPFILE}
	rm ${ZIPFILE}

grammar:
	./generate_sample_utterances.yml | pbcopy
	# Grammar for "sample utterances" has been generated and copied to the clipboard
