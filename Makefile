SHELL=/bin/bash # shell make will use to execute commands
VPATH=.flags # prerequisite search path
$(shell mkdir -p $(VPATH))

root=$(shell cd "$(shell dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )
project=$(shell cat $(root)/package.json | grep '"name":' | head -n 1 | cut -d '"' -f 4 | tr '-' '_')

default:

start-oracle:
	bash start-chainlink.sh
restart-oracle: stop-oracle
	bash start-chainlink.sh
stop-oracle:
	bash ops/stop.sh oracle

