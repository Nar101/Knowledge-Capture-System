tell application "Notes"
	activate
	try
		set currentNote to item 1 of (get selection)
		-- Create a dummy file for testing if real one doesnt exist, but here we assume user has one or we use a known one
		-- Actually simpler: just try to attach the icon file we know exists
		set info to "Attaching icon..."
		make new attachment at end of currentNote with file (POSIX file "/Users/nar/Desktop/Vibe Coding/复制摘录工具/icon.png")
		return "Success"
	on error e
		return "Error: " & e
	end try
end tell
