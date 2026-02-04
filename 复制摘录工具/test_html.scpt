tell application "Notes"
	activate
	try
		set currentNote to item 1 of (get selection)
		set currentBody to body of currentNote
		set body of currentNote to currentBody & "<br><h1>Hello HTML</h1><p>This is a <b>bold</b> test.</p>"
		return "Success"
	on error e
		return "Error: " & e
	end try
end tell
