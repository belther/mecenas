'use client';
import { Suspense, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAction, useConvexAuth, useMutation, useQuery, useConvexConnectionState } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useSignInWithUsernamePassword, useSignUpWithUsernamePassword } from '@convex-dev/auth/methods/username-password/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { formatBRL, parseBRL } from '../../lib/money';
import { ApplyButton, ArtistApplications, ClientApplicationReview } from './applications';
import { ReviewerQueue } from './reviewer';
import { Reputation } from './reputation';
import { Feedback, message } from './feedback';
import { workspaceView } from '../../lib/workspace-view';

type Profile = NonNullable<FunctionReturnType<typeof api.profiles.me>>;
type RequestRow = FunctionReturnType<typeof api.requests.mine>[number];
type Image = { id: Id<'uploads'>; url: string | null };
export default function Panel() {
  const { isLoading, isAuthenticated } = useConvexAuth(); const connection = useConvexConnectionState();
  return <><a className="skip-workspace" href="#workspace-main">Ir para o conteúdo</a><header><a className="wordmark" href="/">mecenas<span>✳</span></a><span className="pill">Ateliê de demonstração</span></header><main className="workspace" id="workspace-main" tabIndex={-1}><p className="demo-note">Use apenas dados fictícios. Os pagamentos deste ateliê são de teste.</p>{!connection.isWebSocketConnected && (connection.hasEverConnected || connection.connectionRetries > 0) && <p className="feedback error" role="status">Conexão interrompida. Confira sua internet; o ateliê tenta reconectar automaticamente. Mantenha esta página aberta para preservar o formulário.</p>}{isLoading ? <p role="status">Abrindo o ateliê…</p> : isAuthenticated ? <Account /> : <Access />}</main></>;
}
function Access() {
  const [create, setCreate] = useState(false); const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  const login = useSignInWithUsernamePassword(api.auth); const signup = useSignUpWithUsernamePassword(api.auth); const pending = login.pending || signup.pending;
  async function submit(event: FormEvent) { event.preventDefault(); if (pending) return; setError(''); const result = await (create ? signup.signUp : login.signIn)({ username, password }); if (result.status !== 'complete') {
    const code = result.userError.error;
    setError(code === 'OTHER_ERROR' ? 'Não foi possível criar ou acessar a conta. O cadastro é restrito aos nomes fictícios autorizados; confira também sua conexão.' : code === 'USERNAME_TAKEN' ? 'Este nome de acesso já está em uso.' : code.startsWith('PASSWORD') ? 'Use uma senha única, com pelo menos 12 caracteres, sem espaços nas pontas.' : code.startsWith('USERNAME') ? 'Use um nome de acesso de 3 a 32 caracteres, com letras, números, ponto, traço ou sublinhado.' : code === 'RATE_LIMITED' ? 'Muitas tentativas. Aguarde um pouco e tente novamente.' : 'Não foi possível entrar. Confira os dados e a conexão.');
  } }
  return <section className="access-grid"><div><p className="eyebrow">UM ESPAÇO PARA SUAS IDEIAS</p><h1>O próximo traço<br />começa <em>aqui.</em></h1><p className="intro">Monte seu portfólio ou conte a ilustração que você quer encomendar. Um acordo claro começa com uma boa apresentação.</p><div className="paper-mark" aria-hidden="true">✳</div></div><form className="panel" onSubmit={submit}><span className="eyebrow">{create ? 'PRIMEIRO ACESSO' : 'BOM TER VOCÊ AQUI'}</span><h2>{create ? 'Crie sua conta de teste' : 'Entre no ateliê'}</h2><label>Nome de acesso<input name="username" autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} disabled={pending} /></label><label>Senha<input name="password" type="password" autoComplete={create ? 'new-password' : 'current-password'} required minLength={create ? 12 : undefined} value={password} onChange={e => setPassword(e.target.value)} disabled={pending} /></label>{create && <p className="hint">Use um nome fictício e uma senha única de pelo menos 12 caracteres. Use um nome fictício autorizado para a demo. Não é necessário informar e-mail ou CPF.</p>}<Feedback error={error} /><button type="submit" disabled={pending}>{pending ? 'Aguarde…' : create ? 'Criar conta' : 'Entrar'} <span aria-hidden="true">↗</span></button><button className="quiet" type="button" disabled={pending} onClick={() => { setCreate(!create); setError(''); }}>{create ? 'Já tenho uma conta' : 'Criar uma conta de teste'}</button></form></section>;
}
function Account() {
  const profile = useQuery(api.profiles.me); const { signOut } = useAuthActions(); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const [editing, setEditing] = useState(false); const reviewDirty = useRef(false);
  function confirmReviewExit() {
    return !reviewDirty.current || window.confirm('A seleção tem alterações sem salvar. Sair da revisão?');
  }
  async function leave() { if (!confirmReviewExit()) return; setPending(true); setError(''); try { await signOut(); } catch { setError('Não foi possível sair. Tente novamente.'); } finally { setPending(false); } }
  const reviewerCases = useQuery(api.disputes.queue, {}); const view = workspaceView(profile, reviewerCases);
  if (view === 'loading' || profile === undefined) return <p role="status">Carregando seu perfil…</p>;
  if (view === 'reviewer') return <><div className="workspace-heading"><div><p className="eyebrow">REVISÃO DA PLATAFORMA</p><h1>{profile ? `Olá, ${profile.displayName}.` : 'Olá.'}</h1><p>Contestações de uso de IA aguardando decisão. Você não decide encomendas em que participa.</p></div><div className="actions"><button className="quiet" disabled={pending} onClick={leave}>{pending ? 'Saindo…' : 'Sair'}</button></div></div><Feedback error={error} /><ReviewerQueue cases={reviewerCases ?? []} /></>;
  return <><div className="workspace-heading"><div><p className="eyebrow">SEU ATELIÊ</p><h1>{profile ? `Olá, ${profile.displayName}.` : 'Como você chega por aqui?'}</h1>{profile && <p>{profile.role === 'artist' ? 'Seu portfólio, novas ideias e espaço para criar.' : 'Dê forma à sua próxima encomenda.'}</p>}</div><div className="actions">{profile && <button className="secondary" onClick={() => { if (editing || confirmReviewExit()) setEditing(!editing); }}>{editing ? 'Voltar às encomendas' : 'Editar perfil'}</button>}<button className="quiet" disabled={pending} onClick={leave}>{pending ? 'Saindo…' : 'Sair'}</button></div></div><Feedback error={error} />{profile && <Reputation profileId={profile._id} />}{!profile || editing ? <ProfileForm key={profile?._id || 'new'} profile={profile} onSaved={() => setEditing(false)} /> : profile.role === 'client' ? <Suspense fallback={<p role="status">Carregando encomendas…</p>}><ClientRequests reviewDirty={reviewDirty} /></Suspense> : <ArtistRequests />}</>;
}
function ProfileForm({ profile, onSaved }: { profile: Profile | null; onSaved: () => void }) {
  const [role, setRole] = useState<'artist' | 'client'>(profile?.role || 'artist'); const [name, setName] = useState(profile?.displayName || ''); const [bio, setBio] = useState(profile?.bio || ''); const [images, setImages] = useState<Image[]>(profile?.portfolioUploadIds.map((id, i) => ({ id, url: profile.images[i] })) || []);
  const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState(''); const save = useMutation(api.profiles.save); const lock = useRef(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (lock.current || uploading) return; lock.current = true; setBusy(true); setError(''); try { await save({ role, displayName: name, bio, portfolioUploadIds: images.map(i => i.id) }); onSaved(); } catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); } }
  return <form className="panel profile-panel" onSubmit={submit}><h2>{profile ? 'Seu perfil' : 'Uma apresentação, para começar'}</h2>{!profile ? <fieldset disabled={busy}><legend>O que você quer fazer? A escolha fica vinculada à sua conta.</legend><div className="role-options"><label><input type="radio" name="role" checked={role === 'artist'} onChange={() => setRole('artist')} /> Criar ilustrações <small>Sou artista</small></label><label><input type="radio" name="role" checked={role === 'client'} onChange={() => setRole('client')} /> Encomendar uma ideia <small>Sou cliente</small></label></div></fieldset> : <p className="tag">{role === 'artist' ? 'Artista · ilustração' : 'Cliente'} · tipo de perfil permanente</p>}<label>Nome de apresentação<input required minLength={2} maxLength={60} value={name} onChange={e => setName(e.target.value)} disabled={busy} /></label><label>Sobre você <span className="hint">opcional</span><textarea maxLength={1000} rows={4} value={bio} onChange={e => setBio(e.target.value)} disabled={busy} /></label>{role === 'artist' && (profile ? <UploadField purpose="portfolio" images={images} onChange={setImages} onBusy={setUploading} disabled={busy} /> : <p className="hint">Salve o perfil para adicionar até 6 imagens ao portfólio.</p>)}<Feedback error={error} /><button disabled={busy || uploading} type="submit">{busy ? 'Salvando…' : 'Salvar perfil'}</button></form>;
}
function UploadField({ purpose, images, onChange, onBusy, disabled }: { purpose: 'portfolio' | 'reference'; images: Image[]; onChange: (images: Image[]) => void; onBusy: (value: boolean) => void; disabled: boolean }) {
  const create = useAction(api.uploads.create); const preview = useAction(api.uploads.preview); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const limit = purpose === 'portfolio' ? 6 : 4; const lock = useRef(false);
  async function upload(file?: File) { if (!file || lock.current || disabled) return; setError(''); if (images.length >= limit) { setError(`Use no máximo ${limit} imagens.`); return; } if (file.size > 5 * 1024 * 1024) { setError('A imagem deve ter até 5 MB. Escolha outro arquivo.'); return; }
    lock.current = true; setPending(true); onBusy(true);
    try { const id = await create({ bytes: await file.arrayBuffer(), contentType: file.type, purpose }); let url: string | null = null; try { url = await preview({ id }); } catch { /* Saved image can still be attached; reload fetches its preview. */ } onChange([...images, { id, url }]); } catch (e) { setError(message(e)); } finally { lock.current = false; setPending(false); onBusy(false); }
  }
  return <fieldset className="upload-field" disabled={disabled || pending}><legend>{purpose === 'portfolio' ? 'Portfólio' : 'Imagens de referência'} <span className="hint">{images.length}/{limit} · opcional</span></legend><p className="hint">JPEG, PNG ou WebP · até 5 MB e 20 megapixels por imagem.</p><div className="image-strip">{images.map((image, index) => <div key={image.id}>{image.url ? <img src={image.url} alt={`${purpose === 'portfolio' ? 'Portfólio' : 'Referência'} ${index + 1}`} /> : <span>Imagem {index + 1} salva</span>}<button type="button" className="quiet" aria-label={`Remover imagem ${index + 1}`} onClick={() => onChange(images.filter(i => i.id !== image.id))}>Remover</button></div>)}</div><label className="file-label">{pending ? 'Validando imagem…' : 'Adicionar imagem'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={images.length >= limit || disabled || pending} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void upload(file); }} /></label><Feedback error={error} /></fieldset>;
}
function ClientRequests({ reviewDirty }: { reviewDirty: React.RefObject<boolean> }) {
  const rows = useQuery(api.requests.mine); const [editing, setEditing] = useState<RequestRow | null>(null); const [version, setVersion] = useState(0); const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false); const [publishing, setPublishing] = useState(false);
  const requestedReview = useSearchParams().get('candidaturas');

  function newDraft() { setEditing(null); setVersion(v => v + 1); setDirty(false); }
  if (requestedReview) {
    const request = rows?.find(row => row._id === requestedReview && row.status !== 'draft');
    return <>
      <a className="workspace-link" href="/painel">Voltar às suas encomendas</a>
      {rows === undefined ? <p role="status">Carregando encomenda…</p> : request ?
        <ClientApplicationReview key={request._id} request={request} dirty={reviewDirty} /> :
        <p role="status">Encomenda indisponível. Volte à lista e escolha uma encomenda publicada.</p>}
    </>;
  }
  return <div className="request-grid"><fieldset className="editor-lock" disabled={publishing}><RequestForm key={editing?._id || `new-${version}`} initial={editing} onDirty={() => setDirty(true)} onBusy={setBusy} onSaved={row => { setEditing(row); setDirty(false); }} onNew={newDraft} /></fieldset><section>{dirty && <p className="hint" role="status">Salve as alterações do formulário antes de publicar uma encomenda.</p>}<div className="section-title"><h2>Suas encomendas</h2><span className="tag">{rows?.length ?? '…'}</span></div>{rows === undefined ? <p role="status">Carregando encomendas…</p> : rows.length === 0 ? <div className="empty"><span aria-hidden="true">↗</span><h3>A primeira ideia é sua.</h3><p>Salve um rascunho. Quando estiver pronto, publique para os artistas.</p></div> : rows.map(row => <RequestCard key={row._id} row={row} blocked={dirty || busy || publishing} onPending={setPublishing} onPublished={() => { if (editing?._id === row._id) newDraft(); }} onEdit={() => setEditing(row)}>
    {row.status !== 'draft' && <Link className="workspace-link" href={`/painel?candidaturas=${row._id}`}
      onClick={event => {
        if (busy || publishing || (dirty && !window.confirm('O rascunho tem alterações sem salvar. Abrir as candidaturas?'))) {
          event.preventDefault();
        }
      }}>Ver candidaturas<span className="visually-hidden"> de {row.title}</span></Link>}
  </RequestCard>)}</section></div>;
}
function RequestForm({ initial, onSaved, onNew, onDirty, onBusy }: { onDirty: () => void; onBusy: (value: boolean) => void; initial: RequestRow | null; onSaved: (row: RequestRow) => void; onNew: () => void }) {
  const [id, setId] = useState(initial?._id); const [title, setTitle] = useState(initial?.title || ''); const [description, setDescription] = useState(initial?.description || ''); const [price, setPrice] = useState(initial ? (initial.pricePerArtistCents / 100).toFixed(2).replace('.', ',') : '50,00'); const [slots, setSlots] = useState(String(initial?.artistSlots || 1)); const [images, setImages] = useState<Image[]>(initial?.exampleUploadIds.map((id, i) => ({ id, url: initial.images[i] })) || []); const [pending, setPending] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const save = useMutation(api.requests.saveDraft); const lock = useRef(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (lock.current || uploading) return; lock.current = true; setPending(true); onBusy(true); setError(''); setSuccess(''); try { const cents = parseBRL(price); const saved = await save({ id, title, description, pricePerArtistCents: cents, artistSlots: Number(slots), exampleUploadIds: images.map(i => i.id) }); setId(saved); onSaved({ _id: saved, title: title.trim(), description: description.trim(), pricePerArtistCents: cents, artistSlots: Number(slots), exampleUploadIds: images.map(i => i.id), images: images.map(i => i.url), artType: 'illustration', status: 'draft' }); setSuccess('Rascunho salvo. Você pode publicar na lista ao lado.'); } catch (e) { setError(message(e)); } finally { lock.current = false; setPending(false); onBusy(false); } }
  return <form className="panel" onChangeCapture={onDirty} onSubmit={submit}><div className="section-title"><h2>{id ? 'Editar rascunho' : 'Conte sua ideia'}</h2>{id && <button className="quiet" type="button" disabled={pending || uploading} onClick={onNew}>Fechar rascunho e criar outro</button>}</div><span className="tag">Ilustração</span><fieldset disabled={pending}><label>Título<input required minLength={5} maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label><label>O que você imagina?<textarea required minLength={20} maxLength={3000} rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Conte a ideia, o estilo e como pretende usar a ilustração." /></label><div className="fields-row"><label>Valor por artista (R$)<input inputMode="decimal" required value={price} onChange={e => setPrice(e.target.value)} /></label><label>Número de artistas<input type="number" required min={1} max={10} step={1} value={slots} onChange={e => setSlots(e.target.value)} /></label></div><p className="hint">Cada artista recebe o valor indicado. O valor não é dividido entre os artistas.</p></fieldset><UploadField purpose="reference" images={images} onChange={next => { setImages(next); onDirty(); }} onBusy={value => { setUploading(value); onBusy(value); }} disabled={pending} /><Feedback error={error} success={success} /><button type="submit" disabled={pending || uploading}>{pending ? 'Salvando…' : 'Salvar rascunho'}</button></form>;
}
function RequestCard({ row, onEdit, blocked = false, onPublished, onPending, children }: { row: RequestRow; onEdit?: () => void; blocked?: boolean; onPublished?: () => void; onPending?: (value: boolean) => void; children?: ReactNode }) {
  const publish = useMutation(api.requests.publish); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  async function open() { if (lock.current || blocked) return; lock.current = true; setPending(true); onPending?.(true); setError(''); try { await publish({ id: row._id }); onPublished?.(); } catch (e) { setError(message(e)); } finally { lock.current = false; setPending(false); onPending?.(false); } }
  return <article className="request-card"><div className="section-title"><span className="eyebrow">ILUSTRAÇÃO</span><span className="tag">{row.status === 'draft' ? 'Rascunho privado' : row.status === 'closed' ? 'Candidaturas encerradas' : 'Publicada'}</span></div><h3>{row.title}</h3><p className="description">{row.description}</p><div className="image-strip">{row.images.map((url, i) => url && <img key={i} src={url} width={110} height={100} loading="lazy" alt={`Referência ${i + 1}`} />)}</div><p className="price">{formatBRL(row.pricePerArtistCents)} <small>por artista</small></p><p className="hint">{row.artistSlots} {row.artistSlots === 1 ? 'artista' : 'artistas'} · zero taxa da plataforma para artistas</p>{onEdit && row.status === 'draft' ? <div className="actions"><button type="button" className="secondary" disabled={pending || blocked} onClick={onEdit}>Editar</button><button type="button" disabled={pending || blocked} onClick={open}>{pending ? 'Publicando…' : 'Publicar encomenda'}</button></div> : children}<Feedback error={error} /></article>;
}
function ArtistRequests() {
  const rows = useQuery(api.requests.browse);
  const applications = useQuery(api.applications.mine);
  const applied = new Set(applications?.map(application => application.requestId));

  return <>
    <ArtistApplications applications={applications} />
    <section className="browse" aria-labelledby="open-requests">
      <h2 id="open-requests">Encomendas abertas</h2>
      {rows === undefined ? <p role="status">Carregando encomendas…</p> : rows.length === 0 ?
        <div className="empty"><h3>Ainda não há encomendas abertas.</h3><p>As encomendas publicadas para candidatura aparecem aqui.</p></div> :
        <div className="browse-grid">{rows.map(row => <RequestCard key={row._id} row={row}>
          <Reputation requestId={row._id} />
          {applications !== undefined && <ApplyButton requestId={row._id} applied={applied.has(row._id)} />}
        </RequestCard>)}</div>}
    </section>
  </>;
}
