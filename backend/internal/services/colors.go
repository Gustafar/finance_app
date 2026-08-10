package services

// colorPalette must stay in sync with frontend/src/utils/categoryColor.js.
var colorPalette = []string{
	"indigo",
	"emerald",
	"orange",
	"pink",
	"sky",
	"amber",
	"violet",
	"lime",
	"slate",
}

var validColorKeys = func() map[string]bool {
	keys := make(map[string]bool, len(colorPalette))
	for _, color := range colorPalette {
		keys[color] = true
	}
	return keys
}()
