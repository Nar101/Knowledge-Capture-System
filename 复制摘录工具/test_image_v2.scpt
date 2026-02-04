tell application "Notes"
	activate
	try
		set currentNote to item 1 of (get selection)
		set myPath to "/Users/nar/Desktop/Vibe Coding/复制摘录工具/icon.png"
		set myFile to (POSIX file myPath)
		make new attachment at end of currentNote with data myFile
		return "Success"
	on error e
		return "Error: " & e
	end try
end tell
