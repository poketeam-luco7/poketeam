import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_URL } from '../api.config';
import { PokemonResume, PokemonService } from '../service/pokemon/pokemon.service';

/** Pokédex du dresseur : ce qu'il a capturé en mode Capture, génération par génération. */
@Component({
  selector: 'app-pokedex',
  standalone: false,
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.css'
})
export class PokedexComponent {
  etat: any = null;               // GET /capture
  erreur = '';
  onglet: number | 'mega' = 1;
  pokemons: PokemonResume[] = [];
  chargement = false;
  affichage: 'tous' | 'possedes' | 'manquants' = 'tous';

  private especes = new Set<string>();
  private megas = new Set<number>();

  constructor(private http: HttpClient, private pokemonService: PokemonService, private router: Router) {}

  ngOnInit() {
    this.http.get<any>(`${API_URL}/capture`).subscribe({
      next: (e) => {
        this.etat = e;
        this.especes = new Set(e.unlockedSpecies || []);
        this.megas = new Set(e.unlockedMegas || []);
        this.choisir(1);
      },
      error: (err) => (this.erreur = err.error?.error || "Le Pokédex n'a pas pu être chargé."),
    });
  }

  get dex() {
    return this.etat?.pokedex;
  }

  compteur(g: number | 'mega') {
    if (!this.dex) return null;
    return g === 'mega' ? this.dex.megas : this.dex.generations[g - 1];
  }

  pourcentage(c: any): number {
    return c && c.total ? Math.round((c.captured / c.total) * 100) : 0;
  }

  choisir(onglet: number | 'mega') {
    this.onglet = onglet;
    this.chargement = true;
    const requete = onglet === 'mega' ? this.pokemonService.getMegas() : this.pokemonService.getGeneration(onglet);
    requete.subscribe({
      // Le Pokédex compte les espèces : les formes alternatives suivent leur espèce
      next: (liste) => { this.pokemons = liste.filter(p => !p.isForm); this.chargement = false; },
      error: () => { this.chargement = false; this.erreur = 'Cette génération n\'a pas pu être chargée.'; },
    });
  }

  capture(p: PokemonResume): boolean {
    return p.isMega ? this.megas.has(Number(p.id)) : this.especes.has(p.baseSpecies);
  }

  get affiches(): PokemonResume[] {
    if (this.affichage === 'possedes') return this.pokemons.filter(p => this.capture(p));
    if (this.affichage === 'manquants') return this.pokemons.filter(p => !this.capture(p));
    return this.pokemons;
  }

  numero(p: PokemonResume): string {
    return typeof p.id === 'number' && p.id < 10000 ? '#' + String(p.id).padStart(4, '0') : '';
  }

  details(p: PokemonResume) {
    if (this.capture(p)) this.router.navigate(['/pokemon', p.id]);
  }
}
