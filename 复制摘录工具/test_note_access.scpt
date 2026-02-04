tell application "Notes"
	if running then
		try
			set currentNote to item 1 of (get selection)
			return name of currentNote
		on error
			return "No note selected"
		end try
	else
		return "Notes app not running"
	end if
end tell
