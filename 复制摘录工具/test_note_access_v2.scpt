tell application "Notes"
	activate
	delay 1
	try
		set currentNote to item 1 of (get selection)
		return name of currentNote
	on error
		return "No note selected"
	end try
end tell
