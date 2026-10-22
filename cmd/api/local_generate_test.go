package main

import "testing"

func TestLocalGenerateOffByDefault(t *testing.T) {
	t.Setenv("ALLOW_LOCAL_GENERATE", "")
	if localGenerateAllowed() {
		t.Fatal("geração local deveria estar desligada por padrão")
	}
}

func TestLocalGenerateOnlyWhenExplicitlyTrue(t *testing.T) {
	t.Setenv("ALLOW_LOCAL_GENERATE", "true")
	if !localGenerateAllowed() {
		t.Fatal("geração local deveria estar ligada com ALLOW_LOCAL_GENERATE=true")
	}
	t.Setenv("ALLOW_LOCAL_GENERATE", "TRUE")
	if localGenerateAllowed() {
		t.Fatal("valor fora do exato 'true' deveria manter a geração local desligada")
	}
}
