package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"finance_app/internal/database"
	"github.com/joho/godotenv"
)

var versionPattern = regexp.MustCompile(`^(\d+)_.*\.up\.sql$`)

type migrationFile struct {
	version string
	path    string
}

func main() {
	_ = godotenv.Load()

	migrationsDir := "../migrations"
	if len(os.Args) > 1 && os.Args[1] == "-dir" && len(os.Args) > 2 {
		migrationsDir = os.Args[2]
	}

	db := database.Connect()
	defer db.Close()

	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`); err != nil {
		log.Fatal("failed to create schema_migrations table: ", err)
	}

	applied := map[string]bool{}
	rows, err := db.Query("SELECT version FROM schema_migrations")
	if err != nil {
		log.Fatal(err)
	}
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			log.Fatal(err)
		}
		applied[v] = true
	}
	rows.Close()

	migrations, err := pendingMigrations(migrationsDir)
	if err != nil {
		log.Fatal(err)
	}

	ranAny := false
	for _, m := range migrations {
		if applied[m.version] {
			continue
		}

		sqlBytes, err := os.ReadFile(m.path)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Printf("applying %s...\n", filepath.Base(m.path))

		tx, err := db.Begin()
		if err != nil {
			log.Fatal(err)
		}

		if _, err := tx.Exec(string(sqlBytes)); err != nil {
			tx.Rollback()
			log.Fatalf("migration %s failed: %v", m.version, err)
		}

		if _, err := tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", m.version); err != nil {
			tx.Rollback()
			log.Fatal(err)
		}

		if err := tx.Commit(); err != nil {
			log.Fatal(err)
		}

		ranAny = true
	}

	if !ranAny {
		fmt.Println("nothing to apply, already up to date")
	} else {
		fmt.Println("done")
	}
}

// pendingMigrations lists every *.up.sql file in dir, sorted by numeric version prefix.
func pendingMigrations(dir string) ([]migrationFile, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var migrations []migrationFile
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".up.sql") {
			continue
		}

		match := versionPattern.FindStringSubmatch(entry.Name())
		if match == nil {
			continue
		}

		migrations = append(migrations, migrationFile{
			version: match[1],
			path:    filepath.Join(dir, entry.Name()),
		})
	}

	sort.Slice(migrations, func(i, j int) bool { return migrations[i].version < migrations[j].version })
	return migrations, nil
}
