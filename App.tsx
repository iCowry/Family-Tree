import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  GitGraph, 
  Map as MapIcon, 
  Scroll, 
  Search, 
  ChevronRight, 
  BookOpen, 
  User, 
  ArrowRight,
  Sparkles,
  Home as HomeIcon,
  X,
  Plus,
  Info,
  Settings,
  Edit2,
  Trash2,
  LogOut,
  Globe,
  Network,
  Dna,
  Share2,
  MapPin,
  Save,
  Flag,
  Calendar,
  UserPlus,
  Heart,
  Check,
  Layout,
  LayoutList,
  Maximize,
  Minimize,
  ArrowLeft,
  Eye,
  EyeOff,
  Filter,
  ChevronDown,
  AlertTriangle,
  Table,
  List,
  Link as LinkIcon,
  History as HistoryIcon,
  PlusCircle,
  MoreHorizontal,
  BookMarked,
  Pencil
} from 'lucide-react';
import { CLAN_INFO, MOCK_MEMBERS, EVENTS, MOCK_SURNAMES } from './constants';
import { Person, Gender, SurnameData, HallData, Family, Region, ClanInfo, LifeEvent, Location } from './types';
import { analyzeRelationship, generateBiography } from './services/geminiService';

// --- Shared UI Components ---

const Stamp = ({ text }: { text: string }) => (
  <div className="inline-flex items-center justify-center w-8 h-8 bg-red-900 rounded-sm shadow-inner mx-1 opacity-90">
    <span className="text-white font-calligraphy text-xs leading-none select-none pt-1">{text}</span>
  </div>
);

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex flex-col items-center mb-8 relative">
    <div className="w-16 h-1 bg-[#5d4037] mb-2 opacity-50"></div>
    <h2 className="text-3xl font-bold font-serif text-[#2c2c2c] tracking-widest">{title}</h2>
    {sub && <span className="text-[#5d4037] uppercase tracking-widest text-xs mt-1">{sub}</span>}
  </div>
);

const Card: React.FC<{ children?: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white/60 backdrop-blur-sm border border-[#dcd9cd] shadow-sm p-6 relative overflow-hidden ${className}`}>
    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#5d4037]/20 rounded-tr-lg"></div>
    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#5d4037]/20 rounded-bl-lg"></div>
    {children}
  </div>
);

// --- Sub-Components ---

const WuFuNode: React.FC<{ role: string, person?: Person, highlight?: boolean }> = ({ role, person, highlight = false }) => (
    <div className={`flex flex-col items-center relative ${!person ? 'opacity-30' : ''}`}>
        <div className={`
            w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-sm relative z-10
            ${highlight ? 'bg-[#8b0000] text-white border-[#8b0000] scale-110' : 'bg-white text-[#2c2c2c] border-[#5d4037]'}
        `}>
            {person ? (
                <span className="font-calligraphy text-xl">{person.givenName}</span>
            ) : (
                <span className="text-xs text-stone-400">未知</span>
            )}
            {highlight && <div className="absolute -inset-1 border border-dashed border-[#8b0000] rounded-full animate-spin-slow"></div>}
        </div>
        <span className={`mt-2 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${highlight ? 'bg-[#8b0000] text-white' : 'bg-[#e8e4d9] text-[#5d4037]'}`}>
            {role}
        </span>
        {person && (
            <span className="text-[10px] text-stone-500 mt-0.5">
                {person.generation}世
            </span>
        )}
    </div>
);

const WuFuConnector = ({ vertical = true }: { vertical?: boolean }) => (
    <div className={`${vertical ? 'h-8 w-px' : 'w-8 h-px'} bg-[#5d4037]/50`}></div>
);

// Five Degrees of Kinship Visualization
const WuFuVisualizer = ({ member, allMembers }: { member: Person, allMembers: Person[] }) => {
    const find = (id?: string) => allMembers.find(m => m.id === id);
    const father = find(member.fatherId);
    const grandfather = find(father?.fatherId);
    const greatGrandfather = find(grandfather?.fatherId);
    const highAncestor = find(greatGrandfather?.fatherId);
    const siblings = member.fatherId 
        ? allMembers.filter(m => m.fatherId === member.fatherId && m.id !== member.id)
        : [];
    const children = allMembers.filter(m => m.fatherId === member.id);

    return (
        <div className="flex flex-col items-center py-8">
            <h3 className="text-lg font-bold text-[#5d4037] mb-8 flex items-center gap-2">
                <Network className="w-5 h-5"/> 五服世系图 (Five Degrees Chart)
            </h3>
            <div className="flex flex-col items-center gap-0">
                <WuFuNode role="高祖" person={highAncestor} />
                <WuFuConnector />
                <WuFuNode role="曾祖" person={greatGrandfather} />
                <WuFuConnector />
                <WuFuNode role="祖父" person={grandfather} />
                <WuFuConnector />
                <WuFuNode role="父亲" person={father} />
                <WuFuConnector />
            </div>
            <div className="relative flex items-center justify-center gap-8 py-4 px-12 bg-[#fff5f5] rounded-full border border-[#8b0000]/20 my-2">
                {siblings.length > 0 && (
                    <>
                        <div className="flex gap-4">
                            {siblings.slice(0, 2).map(s => (
                                <WuFuNode key={s.id} role={s.gender === Gender.Male ? "兄弟" : "姐妹"} person={s} />
                            ))}
                            {siblings.length > 2 && <div className="text-[#5d4037]">...</div>}
                        </div>
                        <div className="w-8 h-px bg-[#8b0000] border-t border-dashed border-[#8b0000]"></div>
                    </>
                )}
                <WuFuNode role="本人" person={member} highlight={true} />
            </div>
            <div className="flex flex-col items-center gap-0">
                <WuFuConnector />
                <div className="flex gap-4">
                    {children.length > 0 ? children.map(c => (
                        <WuFuNode key={c.id} role="子/女" person={c} />
                    )) : <WuFuNode role="子嗣" />}
                </div>
            </div>
        </div>
    );
};

// Full Page Member Detail
const MemberDetailPage = ({ member, familyMembers, globalMembers, onBack, onEdit, onSelect }: { member: Person, familyMembers: Person[], globalMembers: Person[], onBack: () => void, onEdit: (m: Person) => void, onSelect: (m: Person) => void }) => {
    const [aiBio, setAiBio] = useState("");

    useEffect(() => {
        setAiBio("");
        window.scrollTo(0, 0);
    }, [member.id]);

    const getName = (id: string) => {
        const m = globalMembers.find(x => x.id === id);
        return m ? `${m.surname}${m.givenName}` : "未知";
    };

    const isLocalMember = familyMembers.some(m => m.id === member.id);

    return (
        <div className="min-h-screen bg-[#f4f1ea] animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-30 bg-[#2c2c2c] text-[#f4f1ea] px-4 py-4 shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold font-serif tracking-widest">{member.surname}{member.givenName}</h1>
                        <p className="text-xs text-stone-400">{member.generation}世 · {member.generationName}字辈</p>
                    </div>
                </div>
                {isLocalMember && (
                    <button 
                        onClick={() => onEdit(member)}
                        className="flex items-center gap-2 bg-[#8b0000] text-white px-4 py-2 rounded text-sm hover:bg-[#a00000] transition-colors"
                    >
                        <Edit2 className="w-4 h-4" /> 编辑资料
                    </button>
                )}
            </div>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="bg-white">
                            <h3 className="font-bold text-[#8b0000] mb-6 flex items-center gap-2 text-lg border-b pb-2 border-stone-100">
                                <User className="w-5 h-5" /> 基础信息 (Basic Info)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-[#5d4037] uppercase opacity-60 block mb-1">字 / 号</label>
                                    <div className="font-serif text-[#2c2c2c] font-medium">{member.courtesyName || "-"}<span className="mx-1 text-stone-300">/</span>{member.artName || "-"}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#5d4037] uppercase opacity-60 block mb-1">性别</label>
                                    <div className="font-serif text-[#2c2c2c] font-medium">{member.gender === Gender.Male ? "男" : "女"}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#5d4037] uppercase opacity-60 block mb-1">生卒年</label>
                                    <div className="font-serif text-[#2c2c2c] font-medium">{member.birthYear} - {member.deathYear || "至今"}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#5d4037] uppercase opacity-60 block mb-1">居住地</label>
                                    <div className="font-serif text-[#2c2c2c] font-medium">{member.location?.name || "未记录"}</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-white">
                            <h3 className="font-bold text-[#8b0000] mb-6 flex items-center gap-2 text-lg border-b pb-2 border-stone-100">
                                <Users className="w-5 h-5" /> 家族关系 (Relationships)
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center p-3 bg-stone-50 rounded border border-stone-100">
                                    <span className="w-20 font-bold text-[#5d4037] shrink-0 text-sm">父亲:</span>
                                    <span className="font-bold text-[#2c2c2c]">
                                        {member.fatherId ? getName(member.fatherId) : <span className="text-stone-400 font-normal italic">未记录</span>}
                                    </span>
                                </div>
                                <div className="flex items-center p-3 bg-stone-50 rounded border border-stone-100">
                                    <span className="w-20 font-bold text-[#5d4037] shrink-0 text-sm">母亲:</span>
                                    <span className="font-bold text-[#2c2c2c]">
                                        {member.motherName || (member.motherId ? getName(member.motherId) : <span className="text-stone-400 font-normal italic">未记录</span>)}
                                    </span>
                                </div>
                                <div className="flex items-start p-3 bg-stone-50 rounded border border-stone-100">
                                    <span className="w-20 font-bold text-[#5d4037] shrink-0 text-sm mt-1">配偶:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {member.spouses && member.spouses.length > 0 ? (
                                            member.spouses.map((spouseName, i) => {
                                                const spouseObj = globalMembers.find(m => m.id === spouseName || `${m.surname}${m.givenName}` === spouseName || m.givenName === spouseName);
                                                return (
                                                    <span 
                                                        key={i} 
                                                        onClick={() => spouseObj && onSelect(spouseObj)}
                                                        className={`bg-white px-3 py-1 rounded border border-stone-200 text-[#2c2c2c] text-sm shadow-sm flex items-center gap-1 ${spouseObj ? 'cursor-pointer hover:border-[#8b0000] hover:text-[#8b0000]' : ''}`}
                                                    >
                                                        {spouseName}
                                                        {spouseObj && <LinkIcon className="w-3 h-3 opacity-50" />}
                                                    </span>
                                                );
                                            })
                                        ) : <span className="text-stone-400 font-normal italic mt-1">未记录</span>}
                                    </div>
                                </div>
                                <div className="flex items-start p-3 bg-stone-50 rounded border border-stone-100">
                                    <span className="w-20 font-bold text-[#5d4037] shrink-0 text-sm mt-1">子女:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {member.children && member.children.length > 0 ? member.children.map(cid => {
                                            const childMember = globalMembers.find(m => m.id === cid);
                                            return (
                                                <button 
                                                    key={cid} 
                                                    onClick={() => childMember && onSelect(childMember)}
                                                    className="bg-[#fff5f5] text-[#8b0000] px-3 py-1 rounded text-sm border border-[#8b0000]/20 font-medium shadow-sm hover:bg-[#8b0000] hover:text-white transition-colors"
                                                >
                                                    {getName(cid)}
                                                </button>
                                            );
                                        }) : <span className="text-stone-400 font-normal italic mt-1">无记录</span>}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-white min-h-[300px]">
                            <div className="flex justify-between items-center mb-6 border-b pb-2 border-stone-100">
                                <h3 className="font-bold text-[#8b0000] flex items-center gap-2 text-lg">
                                    <Scroll className="w-5 h-5" /> 生平事迹 (Biography)
                                </h3>
                                <button 
                                    onClick={async () => {
                                        try {
                                            if(process.env.API_KEY) {
                                                setAiBio("正在查阅史料，撰写传记中...");
                                                const t = await generateBiography(member);
                                                setAiBio(t || "");
                                            } else {
                                                setAiBio("需要配置 API Key 才能使用 AI 撰写功能。");
                                            }
                                        } catch(e){
                                            setAiBio("生成失败，请稍后重试。");
                                        }
                                    }} 
                                    className="text-xs text-[#8b0000] border border-[#8b0000]/30 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-[#8b0000] hover:text-white transition-all"
                                >
                                    <Sparkles className="w-3 h-3"/> AI 润色
                                </button>
                            </div>
                            <div className="prose prose-stone max-w-none text-justify font-serif leading-loose text-lg text-stone-700">
                                {member.biography || <span className="text-stone-400 italic">暂无详细生平记录。</span>}
                                {aiBio && (
                                    <div className="mt-8 pt-6 border-t border-dashed border-[#5d4037]/20 bg-[#f9f9f9] p-6 rounded relative">
                                        <div className="absolute top-0 left-0 bg-[#8b0000] text-white text-[10px] px-2 py-0.5 rounded-br">AI Generated</div>
                                        <p className="text-stone-700 italic">{aiBio}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <Card className="bg-[#fcfbf9] border-[#dcd9cd]">
                            <WuFuVisualizer member={member} allMembers={globalMembers} />
                        </Card>
                        {member.location?.coordinates && (
                            <Card className="bg-white p-0 overflow-hidden">
                                <div className="bg-[#e8e4d9] h-48 relative flex items-center justify-center">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/China_administrative_divisions_navmap.svg/1200px-China_administrative_divisions_navmap.svg.png')] bg-cover bg-center grayscale"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <MapPin className="w-8 h-8 text-[#8b0000] drop-shadow-md mb-1 animate-bounce" />
                                        <span className="bg-white/90 px-3 py-1 rounded shadow text-xs font-bold text-[#5d4037] border border-[#5d4037]/20">
                                            {member.location.name}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-stone-50 border-t border-stone-200">
                                    <h4 className="font-bold text-[#5d4037] mb-1">定居地信息</h4>
                                    <p className="text-xs text-stone-500">
                                        {member.location.province} · {member.location.name}
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Tree Visualization Components ---

interface TreeNodeProps {
    memberId: string;
    allMembers: Person[];
    globalMembers: Person[]; // For resolving external spouses
    onSelect: (m: Person) => void;
    orientation: 'vertical' | 'horizontal';
    currentDepth: number;
    maxDepth: number;
    showFemales: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ memberId, allMembers, globalMembers, onSelect, orientation, currentDepth, maxDepth, showFemales }) => {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return null;
    
    // If filtering females and this is a female, don't render (unless she is a spouse of someone being rendered, but that logic is handled by parent)
    // However, root nodes could be female. If showFemales is false, we generally hide female descendants.
    if (!showFemales && member.gender === Gender.Female && member.fatherId) return null;

    if (currentDepth > maxDepth) return null;

    let childrenIds = member.children || [];
    if (!showFemales) {
        childrenIds = childrenIds.filter(childId => {
            const child = allMembers.find(m => m.id === childId);
            return child && child.gender === Gender.Male;
        });
    }

    const spouses = member.spouses || [];
    const hasSpouses = spouses.length > 0;
    const hasChildren = childrenIds.length > 0;
    const isMainMale = member.gender === Gender.Male;
    
    const isVertical = orientation === 'vertical';

    // --- Spouse Grouping Logic ---
    const groupedChildren: Record<string, string[]> = {};
    spouses.forEach(s => groupedChildren[s] = []);
    groupedChildren['__unassigned__'] = [];

    childrenIds.forEach(cid => {
            const c = allMembers.find(m => m.id === cid);
            if (isMainMale) {
                // For Male members, group by children's mother name
                if (c && c.motherName && spouses.includes(c.motherName)) {
                    groupedChildren[c.motherName].push(cid);
                } else {
                    groupedChildren['__unassigned__'].push(cid);
                }
            } else {
                // For Female members, children usually have her as mother.
                // We assign children to the spouse (Husband). 
                // Simple logic: if only 1 spouse, assign all. If multiple, ambiguous so put in unassigned or first.
                if (spouses.length > 0) {
                    groupedChildren[spouses[0]].push(cid);
                } else {
                    groupedChildren['__unassigned__'].push(cid);
                }
            }
    });

    const memberBaseStyle = `rounded border text-xs font-bold shadow-sm transition-all hover:shadow-md cursor-pointer flex items-center justify-center relative z-20`;
    const memberStyleMale = `${memberBaseStyle} bg-[#f4f1ea] border-[#5d4037] text-[#2c2c2c] hover:bg-[#e8e4d9]`;
    const memberStyleFemale = `${memberBaseStyle} bg-[#fff5f5] border-[#8b0000] text-[#8b0000] hover:bg-[#ffe0e0]`;
    
    // Spouse style should be opposite of member (usually)
    // If member is Male, spouse is Female (Pink). If member is Female, spouse is Male (Gray/Brown).
    const spouseStyleRaw = isMainMale 
        ? `${memberBaseStyle} bg-[#fff5f5] border-[#ffcccc] text-[#8b0000] hover:bg-[#ffe0e0]` // Female style
        : `${memberBaseStyle} bg-[#f4f1ea] border-[#5d4037] text-[#2c2c2c] hover:bg-[#e8e4d9]`; // Male style

    const getMemberStyle = (m: Person) => m.gender === Gender.Male ? memberStyleMale : memberStyleFemale;

    const nodeLayoutClass = isVertical 
        ? 'py-2 px-1 flex-col writing-mode-vertical-rl min-h-[80px] w-8' 
        : 'px-2 py-1 flex-row gap-2 min-w-[80px] h-8';
        
    const spouseLayoutClass = isVertical
        ? 'py-2 px-1 flex-col writing-mode-vertical-rl text-[10px] min-h-[60px] w-7'
        : 'px-2 py-1 flex-row gap-2 text-[10px] min-w-[60px] h-7';

    const renderName = (m: Person) => {
        const fullGivenName = m.givenName;
        const genChar = m.generationName;
        
        if (!genChar) return <span className="font-bold">{fullGivenName}</span>;
        const parts = fullGivenName.split(genChar);
        if (parts.length > 1) {
            return (
                <span className="font-serif">
                    {parts[0]}
                    <span className="text-[#b91c1c] font-bold mx-px scale-110 inline-block">{genChar}</span>
                    {parts.slice(1).join(genChar)}
                </span>
            );
        }
        return <span className="font-bold">{fullGivenName}</span>;
    };

    return (
        <div className={`flex ${isVertical ? 'flex-col mx-4' : 'flex-row my-4'} items-center`}>
            {/* 1. Husband / Main Member */}
            <div 
                onClick={() => onSelect(member)}
                className={`${getMemberStyle(member)} ${nodeLayoutClass}`}
            >
                <span className="font-serif leading-none whitespace-nowrap">{member.surname}{renderName(member)}</span>
            </div>

            {/* 2. Path to Spouses/Children */}
            {(hasSpouses || hasChildren) && currentDepth < maxDepth && (
                <>
                    {/* Main vertical connector down from Husband */}
                    <div className={`${isVertical ? 'w-px h-6' : 'h-px w-6'} bg-[#5d4037] opacity-60`}></div>

                    {/* Container for Spouses (or Children if no spouses) */}
                    <div className={`flex ${isVertical ? 'flex-row gap-8' : 'flex-col gap-8'} relative`}>
                        
                        {/* 3A. If Spouses Exist -> Render Spouses Row */}
                        {hasSpouses ? (
                            <>
                                {/* Crossbar for multiple spouses */}
                                {spouses.length > 1 && (
                                    <div 
                                        className={`
                                            absolute bg-[#5d4037] opacity-60 -z-10
                                            ${isVertical 
                                                ? 'top-0 h-px left-8 right-8' 
                                                : 'left-0 w-px top-8 bottom-8'
                                            }
                                        `}
                                    ></div>
                                )}

                                {spouses.map((spouseName) => {
                                    // Try to resolve spouse object from global members for clicking
                                    const spouseObj = globalMembers.find(m => m.givenName === spouseName || `${m.surname}${m.givenName}` === spouseName || m.id === spouseName);
                                    const kids = groupedChildren[spouseName] || [];

                                    return (
                                        <div key={spouseName} className={`flex flex-col items-center relative pt-4`}> 
                                            {/* Connector from Crossbar to Spouse */}
                                            {spouses.length > 1 && <div className={`absolute top-0 ${isVertical ? 'h-4 w-px' : 'w-4 h-px'} bg-[#5d4037] opacity-60`}></div>}

                                            {/* Spouse Node */}
                                            <div 
                                                onClick={() => spouseObj && onSelect(spouseObj)}
                                                className={`mb-4 ${spouseStyleRaw} ${spouseLayoutClass} ${!spouseObj && 'cursor-default opacity-80'}`}
                                                title={spouseObj ? "点击查看详情" : "未关联档案"}
                                            >
                                                配: {spouseName}
                                            </div>

                                            {/* Children of this Spouse */}
                                            {kids.length > 0 && (
                                                <div className="flex flex-col items-center">
                                                     {/* Connector from Spouse to Children */}
                                                     <div className={`${isVertical ? 'w-px h-6' : 'h-px w-6'} bg-[#5d4037] opacity-60`}></div>
                                                     
                                                     <div className={`flex relative ${isVertical ? 'pt-4' : 'pl-4 flex-col'}`}>
                                                         {/* Crossbar for kids */}
                                                         {kids.length > 1 && (
                                                             <div className={`
                                                                 absolute bg-[#5d4037] opacity-60 -z-10
                                                                 ${isVertical 
                                                                    ? 'top-0 h-px left-4 right-4' 
                                                                    : 'left-0 w-px top-4 bottom-4'
                                                                 }
                                                             `}></div>
                                                         )}
                                                         
                                                         <div className={`flex ${isVertical ? 'flex-row' : 'flex-col'}`}>
                                                            {kids.map((childId, idx) => (
                                                                <div key={childId} className="relative flex flex-col items-center">
                                                                     {/* Connector from Crossbar to Child */}
                                                                    {kids.length > 1 && <div className={`absolute ${isVertical ? 'top-[-16px] h-4 w-px' : 'left-[-16px] w-4 h-px'} bg-[#5d4037] opacity-60`}></div>}
                                                                    
                                                                    <TreeNode 
                                                                        memberId={childId} 
                                                                        allMembers={allMembers} 
                                                                        globalMembers={globalMembers}
                                                                        onSelect={onSelect} 
                                                                        orientation={orientation}
                                                                        currentDepth={currentDepth + 1}
                                                                        maxDepth={maxDepth}
                                                                        showFemales={showFemales}
                                                                    />
                                                                </div>
                                                            ))}
                                                         </div>
                                                     </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Handle Unassigned Children (if any exist alongside spouses) */}
                                {groupedChildren['__unassigned__']?.length > 0 && (
                                     <div className={`flex flex-col items-center relative pt-4 opacity-70`}>
                                         <div className={`mb-4 border border-dashed border-stone-300 bg-stone-50 text-stone-400 rounded px-2 py-1 text-[10px]`}>庶出/其他</div>
                                         <div className={`${isVertical ? 'w-px h-6' : 'h-px w-6'} bg-[#5d4037] opacity-40`}></div>
                                         <div className={`flex ${isVertical ? 'flex-row' : 'flex-col'} relative pt-4`}>
                                             {groupedChildren['__unassigned__'].length > 1 && (
                                                  <div className={`absolute top-0 h-px left-4 right-4 bg-[#5d4037] opacity-40 -z-10`}></div>
                                             )}
                                             {groupedChildren['__unassigned__'].map(childId => (
                                                  <div key={childId} className="relative flex flex-col items-center">
                                                     {groupedChildren['__unassigned__'].length > 1 && <div className={`absolute top-[-16px] h-4 w-px bg-[#5d4037] opacity-40`}></div>}
                                                     <TreeNode memberId={childId} allMembers={allMembers} globalMembers={globalMembers} onSelect={onSelect} orientation={orientation} currentDepth={currentDepth + 1} maxDepth={maxDepth} showFemales={showFemales} />
                                                  </div>
                                             ))}
                                         </div>
                                     </div>
                                )}

                            </>
                        ) : (
                            /* 3B. No Spouses, just Children (Direct Descent) */
                            <div className={`flex relative ${isVertical ? 'pt-4' : 'pl-4 flex-col'}`}>
                                 {childrenIds.length > 1 && (
                                     <div className={`
                                         absolute bg-[#5d4037] opacity-60 -z-10
                                         ${isVertical 
                                            ? 'top-0 h-px left-4 right-4' 
                                            : 'left-0 w-px top-4 bottom-4'
                                         }
                                     `}></div>
                                 )}
                                 <div className={`flex ${isVertical ? 'flex-row' : 'flex-col'}`}>
                                     {childrenIds.map(childId => (
                                          <div key={childId} className="relative flex flex-col items-center">
                                             {childrenIds.length > 1 && <div className={`absolute ${isVertical ? 'top-[-16px] h-4 w-px' : 'left-[-16px] w-4 h-px'} bg-[#5d4037] opacity-60`}></div>}
                                             <TreeNode memberId={childId} allMembers={allMembers} globalMembers={globalMembers} onSelect={onSelect} orientation={orientation} currentDepth={currentDepth + 1} maxDepth={maxDepth} showFemales={showFemales} />
                                          </div>
                                     ))}
                                 </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// --- New Components for Landing Page Logic ---

// Modal for editing Surname Metadata (Origin, Halls, etc.)
const SurnameEditModal = ({ initialData, onClose, onSave }: { initialData?: SurnameData, onClose: () => void, onSave: (data: SurnameData) => void }) => {
    const [data, setData] = useState<SurnameData>(initialData || {
        character: "",
        pinyin: "",
        origin: "",
        totemDescription: "",
        famousAncestors: [],
        distribution: "",
        populationRank: 999,
        halls: []
    });
    
    // Hall management
    const [halls, setHalls] = useState<HallData[]>(initialData?.halls || []);
    const [newHall, setNewHall] = useState<Partial<HallData>>({});

    const addHall = () => {
        if(newHall.name) {
            setHalls([...halls, { name: newHall.name, description: newHall.description || "", region: newHall.region || "" }]);
            setNewHall({});
        }
    };

    const removeHall = (index: number) => {
        setHalls(halls.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!data.character) {
            alert("姓氏字符不能为空");
            return;
        }
        onSave({ ...data, halls });
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
             <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center sticky top-0">
                     <h3 className="font-bold text-[#5d4037] text-lg flex items-center gap-2">
                         <BookMarked className="w-5 h-5"/> {initialData ? "编辑姓氏百科" : "录入新姓氏"}
                     </h3>
                     <button onClick={onClose}><X className="w-5 h-5 text-stone-400 hover:text-stone-700"/></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Left Column: Basic Info */}
                     <div className="space-y-6">
                         <h4 className="font-bold text-[#8b0000] border-b pb-2 mb-4">基本资料</h4>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase mb-1">姓氏 (Character)</label>
                                 <input 
                                    type="text" 
                                    className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none font-bold text-lg"
                                    value={data.character}
                                    onChange={e => setData({...data, character: e.target.value})}
                                    disabled={!!initialData} // Lock character if editing
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase mb-1">拼音 (Pinyin)</label>
                                 <input 
                                    type="text" 
                                    className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none"
                                    value={data.pinyin}
                                    onChange={e => setData({...data, pinyin: e.target.value})}
                                 />
                             </div>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase mb-1">起源 (Origin)</label>
                             <textarea 
                                className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none h-32 text-sm"
                                value={data.origin}
                                onChange={e => setData({...data, origin: e.target.value})}
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase mb-1">分布情况 (Distribution)</label>
                             <textarea 
                                className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none h-20 text-sm"
                                value={data.distribution}
                                onChange={e => setData({...data, distribution: e.target.value})}
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase mb-1">历史名人 (Famous Ancestors)</label>
                             <input 
                                type="text" 
                                className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none text-sm"
                                placeholder="如：李白, 李世民 (逗号分隔)"
                                value={data.famousAncestors?.join(", ") || ""}
                                onChange={e => setData({...data, famousAncestors: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)})}
                             />
                         </div>
                     </div>

                     {/* Right Column: Halls / Junwang */}
                     <div className="space-y-6">
                         <h4 className="font-bold text-[#8b0000] border-b pb-2 mb-4 flex justify-between items-center">
                             郡望 / 堂号 (Famous Halls)
                         </h4>
                         
                         <div className="bg-stone-50 p-4 rounded border border-stone-200 space-y-3">
                             <div className="text-xs font-bold text-stone-500 uppercase">添加新堂号</div>
                             <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    placeholder="堂号 (如: 陇西堂)" 
                                    className="flex-1 border p-2 rounded text-sm"
                                    value={newHall.name || ""}
                                    onChange={e => setNewHall({...newHall, name: e.target.value})}
                                 />
                                 <input 
                                    type="text" 
                                    placeholder="地区 (如: 甘肃)" 
                                    className="w-24 border p-2 rounded text-sm"
                                    value={newHall.region || ""}
                                    onChange={e => setNewHall({...newHall, region: e.target.value})}
                                 />
                             </div>
                             <input 
                                type="text" 
                                placeholder="简介..." 
                                className="w-full border p-2 rounded text-sm"
                                value={newHall.description || ""}
                                onChange={e => setNewHall({...newHall, description: e.target.value})}
                             />
                             <button 
                                onClick={addHall}
                                disabled={!newHall.name}
                                className="w-full bg-[#5d4037] text-white py-1.5 rounded text-sm disabled:opacity-50 hover:bg-[#4a332a]"
                             >
                                 添加至列表
                             </button>
                         </div>

                         <div className="space-y-2 max-h-[300px] overflow-y-auto">
                             {halls.length === 0 && <div className="text-stone-400 text-sm text-center py-4">暂无记录</div>}
                             {halls.map((hall, idx) => (
                                 <div key={idx} className="bg-white border border-stone-200 p-3 rounded shadow-sm flex justify-between items-start group">
                                     <div>
                                         <div className="font-bold text-stone-700 text-sm flex items-center gap-2">
                                             {hall.name}
                                             {hall.region && <span className="bg-stone-100 text-stone-500 text-[10px] px-1.5 py-0.5 rounded">{hall.region}</span>}
                                         </div>
                                         <div className="text-xs text-stone-500 mt-1">{hall.description}</div>
                                     </div>
                                     <button onClick={() => removeHall(idx)} className="text-stone-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Trash2 className="w-4 h-4"/>
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>

                 <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
                     <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-200 rounded">取消</button>
                     <button onClick={handleSave} className="px-6 py-2 bg-[#8b0000] text-white rounded hover:bg-[#a00000] shadow-sm font-bold">
                         保存百科数据
                     </button>
                 </div>
             </div>
        </div>
    );
};

// Modal for selecting a specific family branch of a surname
const ClanSelectionModal = ({ surname, existingFamilies, onClose, onSelectFamily, onCreateFamily, onDeleteFamily, onEditFamily, onEditSurname }: { 
    surname: SurnameData, 
    existingFamilies: Family[], 
    onClose: () => void, 
    onSelectFamily: (id: string) => void,
    onCreateFamily: () => void,
    onDeleteFamily: (id: string) => void,
    onEditFamily: (family: Family) => void,
    onEditSurname: () => void
}) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#f4f1ea] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="relative h-32 bg-[#2c2c2c] flex items-center justify-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-6 h-6"/></button>
                    <div className="flex flex-col items-center z-10">
                        <div className="w-16 h-16 bg-[#8b0000] rounded-sm flex items-center justify-center shadow-lg border-2 border-[#dcd9cd] mb-2">
                             <span className="font-calligraphy text-4xl text-[#f4f1ea]">{surname.character}</span>
                        </div>
                        <h2 className="text-white font-serif text-xl tracking-widest">{surname.character}氏家族分支</h2>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-bold text-[#5d4037] uppercase opacity-70">已建族谱 ({existingFamilies.length})</h3>
                         <button onClick={onCreateFamily} className="text-[#8b0000] text-sm font-bold flex items-center gap-1 hover:underline">
                             <PlusCircle className="w-4 h-4"/> 新建分支 (Create Branch)
                         </button>
                     </div>

                     {existingFamilies.length === 0 ? (
                         <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-lg bg-stone-50/50">
                             <p className="text-stone-400 mb-4">该姓氏暂无已建立的数字化族谱。</p>
                             <button 
                                onClick={onCreateFamily}
                                className="bg-[#5d4037] text-white px-6 py-2 rounded-full shadow hover:bg-[#4a332a] transition-all"
                             >
                                 创建第一个{surname.character}氏族谱
                             </button>
                         </div>
                     ) : (
                         <div className="grid grid-cols-1 gap-4">
                             {existingFamilies.map(f => (
                                 <div key={f.id} className="bg-white border border-[#dcd9cd] p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                     <div className="flex-1 cursor-pointer" onClick={() => onSelectFamily(f.id)}>
                                         <div className="flex items-center gap-2 mb-1">
                                             <span className="font-bold text-lg text-[#2c2c2c]">{f.info.hallName || "未命名堂号"}</span>
                                             <span className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded-full">{f.members.length} 人</span>
                                         </div>
                                         <div className="text-xs text-stone-500 flex gap-4">
                                             <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {f.info.origin}</span>
                                             <span className="flex items-center gap-1"><User className="w-3 h-3"/> 始祖: {f.info.ancestor}</span>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button 
                                            onClick={() => onEditFamily(f)}
                                            className="p-2 text-stone-400 hover:text-[#5d4037] hover:bg-stone-100 rounded-full"
                                            title="编辑基本信息"
                                         >
                                             <Settings className="w-4 h-4"/>
                                         </button>
                                         <button 
                                            onClick={() => onDeleteFamily(f.id)}
                                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded-full"
                                            title="删除族谱"
                                         >
                                             <Trash2 className="w-4 h-4"/>
                                         </button>
                                         <button 
                                            onClick={() => onSelectFamily(f.id)}
                                            className="ml-2 px-4 py-1.5 bg-[#8b0000] text-white text-sm rounded shadow-sm hover:bg-[#a00000]"
                                         >
                                             进入
                                         </button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                     
                     {/* Informational Section about the Surname */}
                     <div className="mt-8 pt-6 border-t border-stone-200 group relative">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-sm font-bold text-[#5d4037] uppercase opacity-70">关于{surname.character}姓</h3>
                             <button 
                                onClick={onEditSurname}
                                className="text-[#5d4037] hover:text-[#8b0000] text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-100 px-2 py-1 rounded"
                             >
                                 <Pencil className="w-3 h-3"/> 编辑百科
                             </button>
                         </div>
                         <div className="bg-white p-4 rounded border border-stone-200 text-sm text-stone-600 space-y-2 relative">
                             <p><span className="font-bold">起源：</span>{surname.origin}</p>
                             <p><span className="font-bold">分布：</span>{surname.distribution}</p>
                             {surname.famousAncestors && (
                                 <p><span className="font-bold">历史名人：</span>{surname.famousAncestors.join("、")}</p>
                             )}
                             {surname.halls && surname.halls.length > 0 && (
                                 <div className="mt-2 pt-2 border-t border-stone-100">
                                     <span className="font-bold block mb-1">著名郡望/堂号：</span>
                                     <div className="flex flex-wrap gap-2">
                                         {surname.halls.map((h, i) => (
                                             <span key={i} className="bg-stone-100 text-[#5d4037] text-xs px-2 py-0.5 rounded border border-stone-200" title={h.description}>
                                                 {h.name}
                                             </span>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

// Modal for editing Clan Info
const FamilyEditModal = ({ initialInfo, surname, onClose, onSave }: { initialInfo?: ClanInfo, surname: string, onClose: () => void, onSave: (info: ClanInfo) => void }) => {
    const [info, setInfo] = useState<ClanInfo>(initialInfo || {
        surname: surname,
        hallName: "",
        origin: "",
        ancestor: "",
        motto: "",
        generationPoem: ""
    });

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
             <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                 <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
                     <h3 className="font-bold text-[#5d4037]">
                         {initialInfo ? "编辑族谱信息" : "创建新家族分支"}
                     </h3>
                     <button onClick={onClose}><X className="w-5 h-5 text-stone-400"/></button>
                 </div>
                 <div className="p-6 space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase mb-1">堂号 (Hall Name)</label>
                         <input 
                            type="text" 
                            className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none"
                            placeholder="如：陇西堂"
                            value={info.hallName}
                            onChange={e => setInfo({...info, hallName: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase mb-1">发源地 (Origin)</label>
                         <input 
                            type="text" 
                            className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none"
                            placeholder="如：甘肃陇西"
                            value={info.origin}
                            onChange={e => setInfo({...info, origin: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase mb-1">始祖 (First Ancestor)</label>
                         <input 
                            type="text" 
                            className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none"
                            placeholder="如：李利贞"
                            value={info.ancestor}
                            onChange={e => setInfo({...info, ancestor: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase mb-1">族训 (Motto)</label>
                         <textarea 
                            className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none h-20"
                            placeholder="家族传承的训诫..."
                            value={info.motto}
                            onChange={e => setInfo({...info, motto: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase mb-1">字辈诗 (Generation Poem)</label>
                         <textarea 
                            className="w-full border p-2 rounded focus:border-[#8b0000] focus:outline-none h-20"
                            placeholder="用于排辈分的诗句..."
                            value={info.generationPoem}
                            onChange={e => setInfo({...info, generationPoem: e.target.value})}
                         />
                     </div>
                 </div>
                 <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
                     <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-200 rounded">取消</button>
                     <button 
                        onClick={() => {
                            if(!info.hallName) return alert("请输入堂号");
                            onSave(info);
                        }} 
                        className="px-6 py-2 bg-[#8b0000] text-white rounded hover:bg-[#a00000] shadow-sm"
                     >
                         保存
                     </button>
                 </div>
             </div>
        </div>
    );
};

const MemberEditPage = ({ initialData, allMembers, allFamilies, currentFamily, onClose, onSave, onDelete }: { initialData?: Person, allMembers: Person[], allFamilies: Family[], currentFamily: Family, onClose: () => void, onSave: (p: Person) => void, onDelete?: (id: string) => void }) => {
    const [formData, setFormData] = useState<Partial<Person>>(initialData || {
        surname: currentFamily.info.surname,
        generation: 1,
        gender: Gender.Male,
        birthYear: 1900,
        spouses: [],
        children: []
    });

    // Picker State
    const [pickerType, setPickerType] = useState<'FATHER' | 'MOTHER' | 'SPOUSE' | null>(null);
    const [targetFamilyId, setTargetFamilyId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [manualName, setManualName] = useState("");

    const handleChange = (field: keyof Person, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.givenName) {
            alert("请输入名字");
            return;
        }
        const newPerson: Person = {
            id: initialData?.id || Date.now().toString(),
            surname: formData.surname || currentFamily.info.surname,
            givenName: formData.givenName || "",
            courtesyName: formData.courtesyName,
            artName: formData.artName,
            generation: Number(formData.generation),
            generationName: formData.generationName || "",
            gender: formData.gender || Gender.Male,
            birthYear: Number(formData.birthYear),
            deathYear: formData.deathYear ? Number(formData.deathYear) : undefined,
            fatherId: formData.fatherId,
            motherId: formData.motherId,
            motherName: formData.motherName,
            spouses: formData.spouses || [],
            children: formData.children || [],
            biography: formData.biography,
            location: formData.location
        };
        onSave(newPerson);
    };

    // Auto-generation logic
    useEffect(() => {
        if (formData.fatherId) {
            const father = allMembers.find(m => m.id === formData.fatherId);
            if (father) {
                setFormData(prev => ({ ...prev, generation: father.generation + 1 }));
            }
        }
    }, [formData.fatherId, allMembers]);

    // --- Helpers for Relationship Suggestions ---
    
    // Suggest mothers based on selected father's spouses
    const suggestedMothers = useMemo(() => {
        if (!formData.fatherId) return [];
        // Father could be in current family or linked from another
        const father = allFamilies.flatMap(f => f.members).find(m => m.id === formData.fatherId);
        return father?.spouses || [];
    }, [formData.fatherId, allFamilies]);

    // Picker Logic
    const handlePickerSelect = (person: Person) => {
        const name = `${person.surname}${person.givenName}`;
        if (pickerType === 'FATHER') {
             setFormData(prev => ({ ...prev, fatherId: person.id }));
        } else if (pickerType === 'MOTHER') {
            setFormData(prev => ({ ...prev, motherName: name, motherId: person.id }));
        } else if (pickerType === 'SPOUSE') {
            const current = formData.spouses || [];
            if (!current.includes(name)) {
                setFormData(prev => ({ ...prev, spouses: [...current, name] }));
            }
        }
        closePicker();
    };

    const handleManualAdd = () => {
        if (!manualName) return;
        if (pickerType === 'MOTHER') {
            setFormData(prev => ({ ...prev, motherName: manualName, motherId: undefined }));
        } else if (pickerType === 'SPOUSE') {
            const current = formData.spouses || [];
            if (!current.includes(manualName)) {
                setFormData(prev => ({ ...prev, spouses: [...current, manualName] }));
            }
        }
        closePicker();
    };

    const closePicker = () => {
        setPickerType(null);
        setTargetFamilyId("");
        setSearchTerm("");
        setManualName("");
    };

    const removeSpouse = (name: string) => {
        setFormData(prev => ({ ...prev, spouses: (prev.spouses || []).filter(s => s !== name) }));
    };
    
    // Filter candidates for picker
    const candidateMembers = useMemo(() => {
        if (!targetFamilyId) return [];
        const fam = allFamilies.find(f => f.id === targetFamilyId);
        if (!fam) return [];
        return fam.members.filter(m => {
            const fullName = `${m.surname}${m.givenName}`;
            
            // Gender filtering
            if (pickerType === 'FATHER' && m.gender !== Gender.Male) return false;
            // Mother/Spouse filtering usually implies female, but we keep it flexible or strict? 
            // Usually spouses of a male are female.
            if (pickerType === 'MOTHER' && m.gender !== Gender.Female) return false;
            if (pickerType === 'SPOUSE' && formData.gender === Gender.Male && m.gender !== Gender.Female) return false;
            if (pickerType === 'SPOUSE' && formData.gender === Gender.Female && m.gender !== Gender.Male) return false;

            const matchesSearch = fullName.includes(searchTerm);
            return matchesSearch;
        });
    }, [targetFamilyId, allFamilies, searchTerm, pickerType, formData.gender]);

    const getFatherName = () => {
        if (!formData.fatherId) return "未设置";
        const f = allFamilies.flatMap(fam => fam.members).find(m => m.id === formData.fatherId);
        return f ? `${f.surname}${f.givenName}` : "未知ID";
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-stone-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold font-serif text-[#5d4037]">
                        {initialData ? "编辑成员资料" : "新增成员资料"}
                    </h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-stone-400 hover:text-stone-600" /></button>
                </div>

                {/* Body */}
                <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Column 1: Basic Identity */}
                    <div className="space-y-6">
                         <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-2">
                            <User className="w-5 h-5 text-[#8b0000]" />
                            <h4 className="font-bold text-stone-700">基本信息</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">姓氏</label>
                                <input type="text" value={formData.surname} onChange={e => handleChange('surname', e.target.value)} className="w-full border rounded p-2 bg-stone-50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">名字 (Given Name)</label>
                                <input type="text" value={formData.givenName || ''} onChange={e => handleChange('givenName', e.target.value)} className="w-full border rounded p-2 border-[#8b0000]" autoFocus />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">字 / 号</label>
                                <div className="flex gap-2">
                                     <input type="text" placeholder="字" value={formData.courtesyName || ''} onChange={e => handleChange('courtesyName', e.target.value)} className="w-1/2 border rounded p-2" />
                                     <input type="text" placeholder="号" value={formData.artName || ''} onChange={e => handleChange('artName', e.target.value)} className="w-1/2 border rounded p-2" />
                                </div>
                            </div>
                            <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase mb-1">性别</label>
                                 <select value={formData.gender} onChange={e => handleChange('gender', e.target.value as Gender)} className="w-full border rounded p-2">
                                     <option value={Gender.Male}>男</option>
                                     <option value={Gender.Female}>女</option>
                                 </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">出生年份</label>
                                <input type="number" value={formData.birthYear} onChange={e => handleChange('birthYear', parseInt(e.target.value))} className="w-full border rounded p-2" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">去世年份</label>
                                <input type="number" value={formData.deathYear || ''} onChange={e => handleChange('deathYear', e.target.value)} className="w-full border rounded p-2" placeholder="至今" />
                            </div>
                        </div>
                         <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase mb-1">生平简介</label>
                             <textarea 
                                value={formData.biography || ''} 
                                onChange={e => handleChange('biography', e.target.value)} 
                                className="w-full border rounded p-2 h-24 text-sm" 
                             />
                         </div>
                    </div>

                    {/* Column 2: Relations */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-2">
                            <Users className="w-5 h-5 text-[#8b0000]" />
                            <h4 className="font-bold text-stone-700">家族关系</h4>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">世系 (Generation)</label>
                            <input type="number" value={formData.generation} onChange={e => handleChange('generation', parseInt(e.target.value))} className="w-full border rounded p-2" />
                        </div>

                        {/* Father Selection */}
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">父亲 (Father)</label>
                            <div className="flex gap-2">
                                <div className="flex-1 border rounded p-2 bg-stone-50 text-stone-600 flex justify-between items-center">
                                    <span>{getFatherName()}</span>
                                    {formData.fatherId && <Check className="w-4 h-4 text-green-500"/>}
                                </div>
                                <button 
                                    onClick={() => setPickerType('FATHER')}
                                    className="px-3 py-2 bg-stone-100 border rounded text-stone-600 hover:bg-stone-200 whitespace-nowrap text-xs flex items-center gap-1"
                                >
                                    <Edit2 className="w-3 h-3" /> 选择
                                </button>
                                {formData.fatherId && (
                                     <button onClick={() => setFormData(p => ({...p, fatherId: undefined}))} className="text-red-500 hover:bg-red-50 p-2 rounded border border-transparent hover:border-red-100"><X className="w-4 h-4"/></button>
                                 )}
                            </div>
                        </div>

                         {/* Mother Selection */}
                         <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">母亲 (Mother)</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    value={formData.motherName || ''} 
                                    readOnly 
                                    placeholder="未设置"
                                    className="w-full border rounded p-2 bg-stone-50 text-stone-600"
                                />
                                 <button 
                                    onClick={() => setPickerType('MOTHER')}
                                    className="px-3 py-2 bg-stone-100 border rounded text-stone-600 hover:bg-stone-200 whitespace-nowrap text-xs flex items-center gap-1"
                                 >
                                    <Search className="w-3 h-3" /> 选择
                                 </button>
                                 {formData.motherName && (
                                     <button onClick={() => setFormData(p => ({...p, motherName: undefined, motherId: undefined}))} className="text-red-500 hover:bg-red-50 p-2 rounded border border-transparent hover:border-red-100"><X className="w-4 h-4"/></button>
                                 )}
                            </div>
                            
                            {/* Concubine / Multiple Wives Suggestions */}
                            {suggestedMothers.length > 0 && (
                                <div className="bg-[#fffcf5] border border-orange-100 rounded p-2">
                                    <div className="text-[10px] text-orange-600 font-bold mb-1 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3"/> 父亲的配偶 (建议选择)
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedMothers.map((mName) => (
                                            <button 
                                                key={mName}
                                                onClick={() => setFormData(p => ({...p, motherName: mName, motherId: undefined}))} // If we had ID we would link it, simplified here
                                                className="bg-white border border-orange-200 text-orange-800 px-2 py-0.5 rounded text-xs hover:bg-orange-100"
                                            >
                                                {mName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Spouses Selection */}
                         <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase mb-2">配偶 (Spouses)</label>
                             <div className="flex flex-wrap gap-2 mb-2 p-3 border rounded min-h-[50px] bg-stone-50 items-start">
                                 {(formData.spouses || []).map(spouse => (
                                     <span key={spouse} className="bg-white border border-[#dcd9cd] px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm text-[#5d4037] group">
                                         {spouse}
                                         <button onClick={() => removeSpouse(spouse)} className="text-stone-300 hover:text-red-500 ml-1"><X className="w-3 h-3"/></button>
                                     </span>
                                 ))}
                                 <button 
                                    onClick={() => setPickerType('SPOUSE')}
                                    className="bg-[#5d4037] text-white px-3 py-1 rounded-full text-xs hover:bg-[#4a332a] flex items-center gap-1 shadow-sm"
                                 >
                                     <Plus className="w-3 h-3" /> 添加
                                 </button>
                             </div>
                             <p className="text-[10px] text-stone-400">点击“添加”可手动录入或搜索联姻家族成员。</p>
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-stone-200 bg-stone-50 flex justify-between items-center sticky bottom-0">
                    <div>
                        {initialData && onDelete && (
                             <button onClick={() => onDelete(initialData.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 px-4 py-2 hover:bg-red-50 rounded">
                                 <Trash2 className="w-4 h-4"/> 删除成员
                             </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 text-stone-600 hover:bg-stone-200 rounded font-medium">取消</button>
                        <button onClick={handleSave} className="px-8 py-2 bg-[#8b0000] text-white rounded hover:bg-[#a00000] shadow-md font-bold flex items-center gap-2">
                            <Save className="w-4 h-4"/> 保存资料
                        </button>
                    </div>
                </div>

                {/* --- UNIFIED PICKER MODAL --- */}
                {pickerType && (
                    <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur flex flex-col animate-in fade-in zoom-in-95">
                        <div className="p-4 border-b flex justify-between items-center bg-stone-100 shadow-sm">
                             <div>
                                 <h4 className="font-bold text-[#5d4037] text-lg">
                                     {pickerType === 'FATHER' && '选择父亲'}
                                     {pickerType === 'MOTHER' && '选择/设置 母亲'}
                                     {pickerType === 'SPOUSE' && '添加配偶'}
                                 </h4>
                                 <p className="text-xs text-stone-500">
                                     {pickerType === 'FATHER' ? '通常从本家族中选择，也可选择过继来源。' : '可从其他联姻家族选择，或手动录入。'}
                                 </p>
                             </div>
                             <button onClick={closePicker}><X className="w-6 h-6 text-stone-400 hover:text-stone-700"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full space-y-8">
                            
                            {/* Method A: Search & Select */}
                            <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                                <h5 className="font-bold text-stone-700 mb-4 flex items-center gap-2 pb-2 border-b border-stone-100">
                                    <div className="w-6 h-6 rounded-full bg-[#8b0000] text-white flex items-center justify-center text-xs">1</div>
                                    从系统成员中选择
                                </h5>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 block mb-1">目标家族</label>
                                        <select 
                                            className="w-full border p-2.5 rounded text-sm bg-stone-50"
                                            value={targetFamilyId}
                                            onChange={e => setTargetFamilyId(e.target.value)}
                                        >
                                            <option value="">-- 请选择家族 --</option>
                                            {allFamilies.map(f => (
                                                <option key={f.id} value={f.id}>{f.info.surname}氏 ({f.info.hallName})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {targetFamilyId && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="text-xs font-bold text-stone-500 block mb-1">搜索成员</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    placeholder="输入名字查找..." 
                                                    className="w-full border p-2.5 pl-9 rounded text-sm"
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                />
                                                <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400"/>
                                            </div>
                                            
                                            <div className="mt-2 max-h-48 overflow-y-auto border rounded bg-stone-50 divide-y divide-stone-200">
                                                {candidateMembers.length === 0 && (
                                                    <div className="p-4 text-xs text-stone-400 text-center italic">无匹配成员 (请确认性别筛选条件)</div>
                                                )}
                                                {candidateMembers.map(m => (
                                                    <button 
                                                        key={m.id} 
                                                        onClick={() => handlePickerSelect(m)}
                                                        className="w-full text-left p-3 text-sm hover:bg-[#fff5f5] hover:text-[#8b0000] flex justify-between items-center group transition-colors"
                                                    >
                                                        <span className="font-bold">{m.surname}{m.givenName}</span>
                                                        <span className="text-xs text-stone-400 group-hover:text-[#8b0000]/70">
                                                            {m.gender === Gender.Female ? '女' : '男'} · {m.generation}世
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Divider if not FATHER picker (Fathers usually exist in system) */}
                            {pickerType !== 'FATHER' && (
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-stone-200"></div>
                                    <span className="flex-shrink mx-4 text-stone-400 text-xs font-serif italic">或者 (无法找到档案时)</span>
                                    <div className="flex-grow border-t border-stone-200"></div>
                                </div>
                            )}

                            {/* Method B: Manual Input */}
                            {pickerType !== 'FATHER' && (
                                <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm opacity-90 hover:opacity-100 transition-opacity">
                                    <h5 className="font-bold text-stone-700 mb-4 flex items-center gap-2 pb-2 border-b border-stone-100">
                                        <div className="w-6 h-6 rounded-full bg-stone-500 text-white flex items-center justify-center text-xs">2</div>
                                        手动录入姓名
                                    </h5>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="输入姓名 (如: 孙氏)" 
                                            className="flex-1 border p-2.5 rounded text-sm"
                                            value={manualName}
                                            onChange={e => setManualName(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleManualAdd}
                                            disabled={!manualName}
                                            className="bg-stone-600 text-white px-6 py-2 rounded text-sm disabled:opacity-50 font-medium hover:bg-stone-700"
                                        >
                                            确定添加
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-stone-400 mt-2">
                                        * 手动录入的成员将仅保存名字，无法点击跳转查看详情。
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const FamilyTree: React.FC<{ family: Family, globalMembers: Person[], onSelectMember: (m: Person) => void }> = ({ family, globalMembers, onSelectMember }) => {
    const [scale, setScale] = useState(1);
    const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
    const [showFemales, setShowFemales] = useState(true);

    const roots = useMemo(() => {
        let r = family.members.filter(m => m.generation === 1);
        if (r.length === 0) {
            r = family.members.filter(m => !family.members.some(parent => parent.id === m.fatherId));
        }
        return r.sort((a,b) => a.birthYear - b.birthYear);
    }, [family.members]);

    return (
        <div className="w-full h-full overflow-hidden flex flex-col">
            <div className="h-12 bg-white border-b flex items-center justify-between px-4 z-10 shrink-0">
                 <div className="flex gap-2 items-center">
                     <span className="text-xs font-bold text-stone-500 uppercase mr-2">Display:</span>
                     <button onClick={() => setOrientation('vertical')} className={`p-1.5 rounded ${orientation === 'vertical' ? 'bg-stone-200 shadow-inner' : 'hover:bg-stone-100'}`} title="Vertical"><ArrowRight className="w-4 h-4 rotate-90"/></button>
                     <button onClick={() => setOrientation('horizontal')} className={`p-1.5 rounded ${orientation === 'horizontal' ? 'bg-stone-200 shadow-inner' : 'hover:bg-stone-100'}`} title="Horizontal"><ArrowRight className="w-4 h-4"/></button>
                     <div className="w-px h-6 bg-stone-300 mx-2"></div>
                     <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-1.5 hover:bg-stone-100 rounded"><Maximize className="w-4 h-4"/></button>
                     <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="p-1.5 hover:bg-stone-100 rounded"><Minimize className="w-4 h-4"/></button>
                     <button onClick={() => setScale(1)} className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded text-stone-600 font-mono">{Math.round(scale * 100)}%</button>
                 </div>
                 <div className="flex items-center gap-2">
                     <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none font-medium text-stone-600 hover:text-[#8b0000] transition-colors">
                         <input type="checkbox" checked={showFemales} onChange={e => setShowFemales(e.target.checked)} className="rounded text-[#8b0000] focus:ring-[#8b0000]"/>
                         显示女性成员
                     </label>
                 </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#e8e4d9] relative custom-scrollbar cursor-grab active:cursor-grabbing bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:20px_20px] opacity-100">
                <div 
                    className="min-w-max min-h-max p-20 flex justify-center origin-top-center transition-transform duration-200 ease-out"
                    style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                >
                     <div className={`flex ${orientation === 'vertical' ? 'flex-row gap-16' : 'flex-col gap-16'}`}>
                         {roots.map(root => (
                             <div key={root.id} className="bg-white/40 p-8 rounded-3xl border border-stone-300/30 shadow-sm backdrop-blur-sm">
                                <TreeNode 
                                    memberId={root.id} 
                                    allMembers={family.members}
                                    globalMembers={globalMembers}
                                    onSelect={onSelectMember}
                                    orientation={orientation}
                                    currentDepth={1}
                                    maxDepth={20}
                                    showFemales={showFemales}
                                />
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

const MemberListView: React.FC<{ 
    members: Person[], 
    onSelect: (m: Person) => void, 
    onEdit: (m: Person) => void,
    onDelete: (m: Person) => void,
    onAdd: () => void,
    familyInfo: ClanInfo
}> = ({ members, onSelect, onEdit, onDelete, onAdd }) => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState<'gen' | 'age'>('gen');

    const filtered = useMemo(() => {
        return members
        .filter(m => (m.givenName + (m.biography || "")).includes(filter))
        .sort((a, b) => {
            if (sort === 'gen') return a.generation - b.generation || a.birthYear - b.birthYear;
            return a.birthYear - b.birthYear;
        });
    }, [members, filter, sort]);

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b flex justify-between items-center bg-stone-50">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400"/>
                        <input 
                            type="text" 
                            placeholder="搜索成员 (Search)..." 
                            className="pl-9 pr-4 py-2 border rounded-full text-sm w-64 focus:border-[#8b0000] outline-none shadow-sm"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                    <select 
                        className="p-2 border rounded text-sm bg-white shadow-sm focus:border-[#8b0000] outline-none"
                        value={sort}
                        onChange={(e: any) => setSort(e.target.value)}
                    >
                        <option value="gen">按世系排序 (Generation)</option>
                        <option value="age">按年龄排序 (Age)</option>
                    </select>
                </div>
                <button 
                    onClick={onAdd}
                    className="bg-[#8b0000] text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-[#a00000] transition-colors"
                >
                    <Plus className="w-4 h-4"/> 录入新成员 (Add)
                </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-100 text-[#5d4037] text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 w-24">世系 (Gen)</th>
                            <th className="p-4">姓名 (Name)</th>
                            <th className="p-4 hidden md:table-cell">字号 (Courtesy Name)</th>
                            <th className="p-4">生卒年 (Life)</th>
                            <th className="p-4 hidden md:table-cell">配偶 (Spouse)</th>
                            <th className="p-4 text-right">操作 (Actions)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                        {filtered.map(m => (
                            <tr key={m.id} className="hover:bg-[#fffcf5] group transition-colors">
                                <td className="p-4 text-stone-500 font-mono whitespace-nowrap">
                                    <span className="bg-stone-200 text-stone-600 px-2 py-0.5 rounded text-xs">{m.generation}世</span>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => onSelect(m)} className="font-bold text-[#2c2c2c] hover:text-[#8b0000] hover:underline flex items-center gap-2">
                                        {m.surname}{m.givenName}
                                        {m.gender === Gender.Female && <span className="text-[10px] text-pink-500 bg-pink-50 px-1 rounded border border-pink-100">女</span>}
                                    </button>
                                </td>
                                <td className="p-4 text-stone-600 hidden md:table-cell">{m.courtesyName || <span className="text-stone-300">-</span>}</td>
                                <td className="p-4 font-mono text-stone-500 whitespace-nowrap">{m.birthYear} - {m.deathYear || "..."}</td>
                                <td className="p-4 text-stone-500 max-w-xs truncate hidden md:table-cell">
                                    {m.spouses && m.spouses.length > 0 ? m.spouses.join(", ") : <span className="text-stone-300">-</span>}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(m)} className="p-1.5 text-stone-400 hover:text-[#5d4037] hover:bg-stone-100 rounded" title="编辑"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => onDelete(m)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                        <Users className="w-12 h-12 mb-2 opacity-20"/>
                        <p className="italic">未找到相关成员</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const FamilyApp = ({ family, allFamilies, onExit, onUpdateFamily }: { family: Family, allFamilies: Family[], onExit: () => void, onUpdateFamily: (f: Family) => void }) => {
    const [selectedMember, setSelectedMember] = useState<Person | null>(null);
    const [viewMode, setViewMode] = useState<'TREE' | 'LIST'>('TREE');
    const [isEditing, setIsEditing] = useState(false);
    const [editingMember, setEditingMember] = useState<Person | null>(null);

    const globalMembers = useMemo(() => allFamilies.flatMap(f => f.members), [allFamilies]);

    const handleSaveMember = (member: Person) => {
        let updatedMembers = [...family.members];
        const existingIndex = updatedMembers.findIndex(m => m.id === member.id);

        if (existingIndex >= 0) {
            // Update
            updatedMembers[existingIndex] = member;
        } else {
            // Add new
            updatedMembers.push(member);
            // If has father, update father's children list
            if (member.fatherId) {
                const fatherIndex = updatedMembers.findIndex(m => m.id === member.fatherId);
                if (fatherIndex >= 0) {
                     const father = updatedMembers[fatherIndex];
                     if (!father.children.includes(member.id)) {
                         updatedMembers[fatherIndex] = {
                             ...father,
                             children: [...father.children, member.id]
                         };
                     }
                }
            }
        }
        
        onUpdateFamily({ ...family, members: updatedMembers });
        setIsEditing(false);
        setEditingMember(null);
        // Refresh detail view if editing the currently viewed member
        if (selectedMember && selectedMember.id === member.id) {
            setSelectedMember(member);
        }
    };

    const handleDeleteMember = (id: string) => {
        const member = family.members.find(m => m.id === id);
        if (!member) return;
        if (!confirm(`确定要删除 ${member.givenName} 吗？此操作不可撤销，且会影响其后代关系的显示。`)) return;
        
        const updatedMembers = family.members.filter(m => m.id !== id);
        // Clean up references in parents
        if (member.fatherId) {
            const father = updatedMembers.find(m => m.id === member.fatherId);
            if (father) {
                father.children = father.children.filter(cid => cid !== id);
            }
        }
        
        onUpdateFamily({ ...family, members: updatedMembers });
        if (selectedMember && selectedMember.id === id) {
            setSelectedMember(null);
        }
        setIsEditing(false);
        setEditingMember(null);
    };

    // Render Edit Page
    if (isEditing) {
        return (
            <MemberEditPage 
                initialData={editingMember || undefined}
                allMembers={family.members}
                allFamilies={allFamilies}
                currentFamily={family}
                onClose={() => { setIsEditing(false); setEditingMember(null); }}
                onSave={handleSaveMember}
                onDelete={handleDeleteMember}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {selectedMember ? (
                <MemberDetailPage 
                    member={selectedMember} 
                    familyMembers={family.members}
                    globalMembers={globalMembers}
                    onBack={() => setSelectedMember(null)}
                    onEdit={(m) => {
                        setEditingMember(m);
                        setIsEditing(true);
                    }}
                    onSelect={(m) => setSelectedMember(m)}
                />
            ) : (
                <div className="flex flex-1 overflow-hidden relative">
                    {/* Sidebar Info */}
                    <div className="w-80 bg-[#fbf9f6] border-r border-[#dcd9cd] flex flex-col z-20 shadow-xl absolute md:relative h-full transition-transform -translate-x-full md:translate-x-0">
                        <div className="p-6 border-b border-[#dcd9cd] bg-[#f4f1ea]">
                            <button onClick={onExit} className="flex items-center gap-2 text-xs text-[#5d4037] mb-4 hover:underline">
                                <LogOut className="w-4 h-4" /> 返回首页
                            </button>
                            <h1 className="text-3xl font-serif font-bold text-[#2c2c2c] mb-1">{family.info.surname}氏族谱</h1>
                            <div className="flex items-center gap-2 text-[#8b0000] font-bold text-sm">
                                <Stamp text={family.info.surname} />
                                {family.info.hallName}
                            </div>
                        </div>

                        <div className="px-6 pt-6">
                            <h3 className="text-xs font-bold text-[#5d4037] uppercase opacity-60 mb-2 flex items-center gap-1"><Layout className="w-3 h-3"/> 视图模式 (View)</h3>
                            <div className="flex bg-[#e8e4d9] p-1 rounded-lg">
                                <button 
                                    onClick={() => setViewMode('TREE')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded ${viewMode === 'TREE' ? 'bg-white text-[#5d4037] shadow-sm' : 'text-stone-500 hover:text-[#5d4037]'}`}
                                >
                                    <GitGraph className="w-4 h-4"/> 世系图
                                </button>
                                <button 
                                    onClick={() => setViewMode('LIST')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded ${viewMode === 'LIST' ? 'bg-white text-[#5d4037] shadow-sm' : 'text-stone-500 hover:text-[#5d4037]'}`}
                                >
                                    <List className="w-4 h-4"/> 成员表
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            <div>
                                <h3 className="text-xs font-bold text-[#5d4037] uppercase opacity-60 mb-2 flex items-center gap-1"><BookOpen className="w-3 h-3"/> 族训 (Motto)</h3>
                                <p className="font-serif text-[#2c2c2c] leading-relaxed italic bg-white p-3 rounded border border-stone-200 shadow-sm text-sm">
                                    "{family.info.motto}"
                                </p>
                            </div>
                            
                            <div>
                                <h3 className="text-xs font-bold text-[#5d4037] uppercase opacity-60 mb-2 flex items-center gap-1"><Dna className="w-3 h-3"/> 字辈 (Generation Poem)</h3>
                                <div className="flex flex-wrap gap-1">
                                    {family.info.generationPoem.split('').map((char, i) => (
                                        <div key={i} className="w-6 h-6 flex items-center justify-center bg-[#5d4037] text-[#f4f1ea] rounded-sm text-xs font-serif shadow-sm">
                                            {char}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                             <div>
                                <h3 className="text-xs font-bold text-[#5d4037] uppercase opacity-60 mb-2 flex items-center gap-1"><Flag className="w-3 h-3"/> 发源 (Origin)</h3>
                                <p className="text-sm text-[#5d4037]">{family.info.origin}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-xs font-bold text-[#5d4037] uppercase opacity-60 mb-2 flex items-center gap-1"><Users className="w-3 h-3"/> 统计 (Stats)</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-white p-2 rounded border text-center">
                                        <div className="text-lg font-bold text-[#8b0000]">{family.members.length}</div>
                                        <div className="text-xs text-stone-500">成员总数</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border text-center">
                                         <div className="text-lg font-bold text-[#8b0000]">{Math.max(...family.members.map(m=>m.generation))}</div>
                                        <div className="text-xs text-stone-500">繁衍代数</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content View */}
                    <div className="flex-1 relative bg-[#e8e4d9]">
                        {viewMode === 'TREE' ? (
                            <FamilyTree family={family} globalMembers={globalMembers} onSelectMember={setSelectedMember} />
                        ) : (
                            <MemberListView 
                                members={family.members} 
                                onSelect={setSelectedMember} 
                                onEdit={(m) => { setEditingMember(m); setIsEditing(true); }}
                                onDelete={(m) => handleDeleteMember(m.id)}
                                onAdd={() => { setEditingMember(null); setIsEditing(true); }}
                                familyInfo={family.info} 
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    // Surnames state (Encyclopedia Data)
    const [surnames, setSurnames] = useState<SurnameData[]>(MOCK_SURNAMES);
    
    // Families state (User created genealogies)
    const [families, setFamilies] = useState<Family[]>(() => {
        const liFamily: Family = {
            id: "li-family-demo",
            info: CLAN_INFO,
            members: MOCK_MEMBERS,
            events: EVENTS,
            createdAt: Date.now()
        };
        return [liFamily];
    });
    
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
    const [viewingSurname, setViewingSurname] = useState<SurnameData | null>(null);
    
    // Modal controls
    const [isEditingClan, setIsEditingClan] = useState<{ isOpen: boolean, familyId?: string, surname?: string }>({ isOpen: false });
    const [isEditingSurname, setIsEditingSurname] = useState<{ isOpen: boolean, data?: SurnameData }>({ isOpen: false });
    
    const [searchTerm, setSearchTerm] = useState("");

    const handleSelectSurnameCard = (surnameData: SurnameData) => {
        setViewingSurname(surnameData);
    };

    // --- Surname Encyclopedia Handlers ---
    const handleUpdateSurname = (updatedData: SurnameData) => {
        const exists = surnames.find(s => s.character === updatedData.character);
        if (exists) {
            setSurnames(prev => prev.map(s => s.character === updatedData.character ? updatedData : s));
        } else {
            setSurnames(prev => [...prev, updatedData]);
        }
        setIsEditingSurname({ isOpen: false });
        
        // If we are currently viewing this surname, update the view
        if (viewingSurname?.character === updatedData.character) {
            setViewingSurname(updatedData);
        }
    };

    // --- Family/Clan Handlers ---
    const handleCreateFamily = (info: ClanInfo) => {
        const newFamily: Family = {
            id: Date.now().toString(),
            info: info,
            members: [],
            events: [],
            createdAt: Date.now()
        };
        setFamilies(prev => [...prev, newFamily]);
        setIsEditingClan({ isOpen: false });
    };

    const handleUpdateClanInfo = (info: ClanInfo) => {
        if (isEditingClan.familyId) {
            setFamilies(prev => prev.map(f => f.id === isEditingClan.familyId ? { ...f, info } : f));
            setIsEditingClan({ isOpen: false });
        } else {
            handleCreateFamily(info);
        }
    };

    const handleDeleteFamily = (id: string) => {
        if(confirm("确定要删除该家族族谱吗？所有成员数据将被永久删除。")) {
            setFamilies(prev => prev.filter(f => f.id !== id));
        }
    };

    const currentFamily = families.find(f => f.id === selectedFamilyId);

    const handleUpdateFamilyMembers = (updated: Family) => {
        setFamilies(prev => prev.map(f => f.id === updated.id ? updated : f));
    };

    if (currentFamily) {
        return (
            <FamilyApp 
                family={currentFamily} 
                allFamilies={families} 
                onExit={() => setSelectedFamilyId(null)}
                onUpdateFamily={handleUpdateFamilyMembers}
            />
        );
    }

    const displayedSurnames = surnames.filter(s => 
        s.character.includes(searchTerm) || s.pinyin.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#f4f1ea] font-sans text-[#2c2c2c]">
            <header className="bg-[#2c2c2c] text-[#f4f1ea] py-12 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"></div>
                <div className="container mx-auto text-center relative z-10">
                   <div className="w-20 h-20 mx-auto bg-[#8b0000] rounded-sm flex items-center justify-center shadow-lg mb-6 border-4 border-[#dcd9cd]">
                        <span className="font-calligraphy text-5xl text-[#f4f1ea]">族</span>
                   </div>
                   <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 tracking-widest">中华族谱系统</h1>
                   <p className="text-lg opacity-80 font-serif max-w-2xl mx-auto">Connecting generations, preserving history. Digital genealogy for the modern age.</p>
                </div>
            </header>
            
            <main className="container mx-auto px-4 py-12">
                 <div className="max-w-xl mx-auto mb-12 flex gap-4">
                      <div className="relative flex-1">
                          <input 
                              type="text" 
                              placeholder="输入姓氏查找 (Search Surname)..." 
                              className="w-full pl-12 pr-4 py-4 rounded-full shadow-lg border-2 border-[#dcd9cd] focus:border-[#8b0000] focus:outline-none text-lg"
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                          />
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-6 h-6" />
                      </div>
                      <button 
                        onClick={() => setIsEditingSurname({ isOpen: true })}
                        className="bg-[#5d4037] text-white px-6 rounded-full shadow-lg flex items-center gap-2 hover:bg-[#4a332a] transition-all whitespace-nowrap"
                      >
                          <Plus className="w-5 h-5"/> 新增姓氏
                      </button>
                 </div>
      
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                     {displayedSurnames.map(s => {
                         const branchCount = families.filter(f => f.info.surname === s.character).length;
                         return (
                             <button 
                                  key={s.character}
                                  onClick={() => handleSelectSurnameCard(s)}
                                  className="bg-white rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-[#dcd9cd] group text-left relative"
                             >
                                  {branchCount > 0 && (
                                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#5d4037] text-white text-[10px] ring-2 ring-white z-10">
                                          {branchCount} 支
                                      </div>
                                  )}
                                  <div className="h-24 bg-[#f4f1ea] flex items-center justify-center group-hover:bg-[#8b0000] transition-colors duration-300">
                                      <span className="font-calligraphy text-5xl text-[#5d4037] group-hover:text-white transition-colors duration-300">{s.character}</span>
                                  </div>
                                  <div className="p-4">
                                      <div className="flex justify-between items-baseline mb-1">
                                          <span className="font-bold text-lg">{s.pinyin}</span>
                                          <span className="text-xs text-stone-400">排名: {s.populationRank}</span>
                                      </div>
                                      <p className="text-xs text-stone-500 line-clamp-2">{s.origin}</p>
                                  </div>
                             </button>
                         );
                     })}
                 </div>
                 
                 {displayedSurnames.length === 0 && (
                     <div className="text-center text-stone-400 py-20">
                         <p>未找到该姓氏，请尝试添加。</p>
                     </div>
                 )}
            </main>
            
            <footer className="bg-[#2c2c2c] text-stone-500 py-8 text-center text-sm">
                <p>&copy; 2024 Chinese Genealogy System. Preserving Heritage.</p>
            </footer>

            {/* --- MODALS --- */}
            
            {/* 1. Clan Selection Modal (List of families for a surname) */}
            {viewingSurname && (
                <ClanSelectionModal 
                    surname={viewingSurname}
                    existingFamilies={families.filter(f => f.info.surname === viewingSurname.character)}
                    onClose={() => setViewingSurname(null)}
                    onSelectFamily={(id) => {
                        setSelectedFamilyId(id);
                        setViewingSurname(null);
                    }}
                    onCreateFamily={() => setIsEditingClan({ isOpen: true, surname: viewingSurname.character })}
                    onDeleteFamily={handleDeleteFamily}
                    onEditFamily={(f) => setIsEditingClan({ isOpen: true, familyId: f.id, surname: f.info.surname })}
                    onEditSurname={() => {
                        setIsEditingSurname({ isOpen: true, data: viewingSurname });
                    }}
                />
            )}

            {/* 2. Clan Info Edit Modal (For specific family branch) */}
            {isEditingClan.isOpen && (
                <FamilyEditModal 
                    surname={isEditingClan.surname || ""}
                    initialInfo={isEditingClan.familyId ? families.find(f => f.id === isEditingClan.familyId)?.info : undefined}
                    onClose={() => setIsEditingClan({ isOpen: false })}
                    onSave={handleUpdateClanInfo}
                />
            )}

            {/* 3. Surname Encyclopedia Edit Modal (Reference Data) */}
            {isEditingSurname.isOpen && (
                <SurnameEditModal 
                    initialData={isEditingSurname.data}
                    onClose={() => setIsEditingSurname({ isOpen: false })}
                    onSave={handleUpdateSurname}
                />
            )}

        </div>
    );
};

export default App;