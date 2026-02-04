tell application "Notes"
	activate
	try
		set newNote to make new note with properties {name:"Snippet Collector Test", body:"Test Body"}
		return "Created note ID: " & id of newNote
	on error e
		return "Error: " & e
	end try
end tell
