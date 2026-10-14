import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_URL } from '../api.config';
import { typeFr } from '../commun/pokemon-types';
import { NomPokemonPipe } from '../commun/nom-pokemon.pipe';
import { CombatCaptureService } from '../service/capture/combat-capture.service';

@Component({
  selector: 'app-capture',
  standalone: false,
  templateUrl: './capture.component.html',
  styleUrl: './capture.component.css'
})
export class CaptureComponent {
  etat: any = null;           // réponse de GET /capture
  chargement = true;
  erreur = '';
  annonces: string[] = [];

  // Préparation d'une run : palier d'abord, puis l'équipe (figée pendant la run)
  palier: any = null;
  selection: (number | string)[] = [];
  static readonly ECART_MAX = 1;   // même règle que le serveur : 1 palier sous le sien, pas 2

  private readonly noms = new NomPokemonPipe();
  typeFr = typeFr;

  constructor(private http: HttpClient, private router: Router, private combat: CombatCaptureService) {}

  ngOnInit() {
    this.annonces = this.combat.annonces;
    this.combat.annonces = [];
    this.recharger();
  }

  recharger() {
    this.http.get<any>(`${API_URL}/capture`).subscribe({
      next: (e) => { this.etat = e; this.chargement = false; this.initSelection(); },
      error: (err) => this.echec(err),
    });
  }

  private echec(err: HttpErrorResponse) {
    this.chargement = false;
    this.erreur = err.error?.error || 'Le mode Capture est indisponible pour le moment.';
  }

  private maj(e: any) {
    this.etat = { started: true, ...e };
    this.erreur = '';
    this.initSelection();
  }

  /** On garde la composition précédente (sans ce qui n'est plus dans la collection),
   *  ou on propose le starter. */
  private initSelection() {
    const permis = new Set((this.etat?.collection || []).filter((c: any) => !this.tropFort(c)).map((c: any) => c.id));
    this.selection = this.selection.filter(id => permis.has(id));
    if (!this.selection.length && permis.has(this.etat?.starter)) this.selection = [this.etat.starter];
  }

  choisirPalier(t: any) {
    this.palier = t;
    this.erreur = '';
    this.initSelection();   // retire ceux qui sont trop forts pour ce palier
  }

  /** Interdit de combattre 2 paliers (ou plus) sous le sien. */
  tropFort(p: any): boolean {
    return !!this.palier && p.tier != null && p.tier - this.palier.index > CaptureComponent.ECART_MAX;
  }

  // --- Départ -----------------------------------------------------------------------

  choisirStarter(id: number) {
    this.http.post<any>(`${API_URL}/capture/start`, { starter: id }).subscribe({
      next: (e) => this.maj(e),
      error: (err) => this.echec(err),
    });
  }

  // --- Équipe -------------------------------------------------------------------------

  /** Équipe de la run en cours (instantanés stockés au lancement). */
  get equipeRun(): any[] {
    return this.etat?.run?.team || [];
  }

  /** Victoires de l'espèce et prochain déblocage (une Méga compte pour son espèce). */
  progression(p: any) {
    return this.etat?.progress?.[p.baseSpecies || p.name] || null;
  }

  pourcentage(prog: any): number {
    return Math.min(100, Math.round((prog.victories / prog.threshold) * 100));
  }

  prochain(prog: any): string {
    if (prog.next[0] === 'mega') return 'Méga-Évolution';
    return prog.next.length > 1 ? `${prog.next.length} évolutions possibles` : this.noms.transform(prog.next[0]);
  }

  basculer(p: any) {
    if (this.etat.run || this.tropFort(p)) return;
    const id = p.id;
    const i = this.selection.indexOf(id);
    if (i !== -1) this.selection.splice(i, 1);
    else if (this.selection.length < 6) this.selection.push(id);
  }

  // --- Runs ---------------------------------------------------------------------------

  lancerRun() {
    if (!this.palier) return;
    const tier = this.palier.index;
    if (!this.selection.length) {
      this.erreur = 'Choisis au moins un Pokémon pour la run.';
      return;
    }
    this.http.post<any>(`${API_URL}/capture/run`, { tier, pokemonIds: this.selection }).subscribe({
      next: (run) => { this.etat.run = run; this.erreur = ''; this.palier = null; },
      error: (err) => (this.erreur = err.error?.error || "La run n'a pas pu démarrer."),
    });
  }

  abandonner() {
    if (!confirm('Abandonner la run en cours ? Les victoires déjà obtenues restent acquises.')) return;
    this.http.delete(`${API_URL}/capture/run`).subscribe(() => this.recharger());
  }

  combattre(wildId: number) {
    this.http.post<any>(`${API_URL}/capture/run/fight`, { wildId }).subscribe({
      next: (r) => {
        this.combat.dernier = r;
        this.combat.annonces = (r.evolutions || []).map((id: any) => {
          const p = r.collection.find((c: any) => c.id === id);
          return `${p ? this.noms.transform(p.name) : 'Une évolution'} débloqué !`;
        });
        if (r.trainingComplete) this.combat.annonces.unshift('Entraînement réussi : 3 victoires pour chaque membre !');
        this.router.navigate(['/capture/combat']);
      },
      error: (err) => (this.erreur = err.error?.error || "Le combat n'a pas pu avoir lieu."),
    });
  }

  capturer(pokemonId: number) {
    this.http.post<any>(`${API_URL}/capture/run/reward`, { pokemonId }).subscribe({
      next: (r) => {
        this.annonces = [`${this.noms.transform(r.captured.name)} rejoint ta collection !`];
        this.maj(r);
      },
      error: (err) => (this.erreur = err.error?.error || 'La capture a échoué.'),
    });
  }

  choisirEvolution(to: number) {
    this.http.post<any>(`${API_URL}/capture/evolution`, { to }).subscribe({
      next: (r) => {
        const p = r.collection.find((c: any) => c.id === to);
        this.annonces = [`${this.noms.transform(p?.name)} débloqué !`];
        this.maj(r);
      },
      error: (err) => (this.erreur = err.error?.error || "L'évolution n'a pas pu être choisie."),
    });
  }

  libellePalier(t: any): string {
    return `${t.min} – ${t.max}`;
  }
}
