import React, { useState, useEffect, useMemo } from 'react';
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
  Check
} from 'lucide-react';
import { CLAN_INFO, MOCK_MEMBERS, EVENTS, MOCK_SURNAMES } from './constants';
import { Person, Gender, SurnameData, HallData, Family, Region, ClanInfo, LifeEvent } from './types';
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

const Card = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <div className={`bg-white/60 backdrop-blur-sm border border-[#dcd9cd] shadow-sm p-6 relative overflow-hidden ${className}`}>
    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#5d4037]/20 rounded-tr-lg"></div>
    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#5d4037]/20 rounded-bl-lg"></div>
    {children}
  </div>
);

// --- Sub-Components ---

// Tree Visualization
const TreeNode: React.FC<{ memberId: string, allMembers: Person[], onSelect: (m: Person) => void }> = ({ memberId, allMembers, onSelect }) => {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return null;

    const hasChildren = member.children && member.children.length > 0;

    return (
        <div className="flex flex-col items-center mx-4">
            <div 
                onClick={() => onSelect(member)}
                className={`
                    w-12 h-32 border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-lg relative
                    ${member.gender === Gender.Male ? 'border-[#5d4037] bg-[#f4f1ea]' : 'border-[#8b0000] bg-[#fff5f5]'}
                `}
            >
                <span className="font-calligraphy text-lg writing-mode-vertical-rl py-2">{member.surname}{member.givenName}</span>
            </div>
            {hasChildren && (
                <>
                    <div className="w-px h-8 bg-[#5d4037]"></div>
                    <div className="flex relative">
                        <div className="absolute top-0 left-4 right-4 h-px bg-[#5d4037] -z-10"></div>
                        <div className="flex pt-4">
                            {member.children.map(childId => (
                                <TreeNode key={childId} memberId={childId} allMembers={allMembers} onSelect={onSelect} />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// --- Forms ---

const MemberFormModal = ({ 
    initialData, 
    allMembers, 
    allFamilies,
    onClose, 
    onSave 
}: { 
    initialData?: Person, 
    allMembers: Person[], 
    allFamilies: Family[],
    onClose: () => void, 
    onSave: (p: Person) => void 
}) => {
    // Default form state
    const [formData, setFormData] = useState<Person>(initialData || {
        id: Date.now().toString(),
        surname: allMembers[0]?.surname || "李",
        givenName: "",
        courtesyName: "",
        artName: "",
        generation: allMembers.length > 0 ? Math.max(...allMembers.map(m => m.generation)) + 1 : 1,
        generationName: "",
        gender: Gender.Male,
        birthYear: 1980,
        deathYear: undefined,
        fatherId: "",
        spouses: [],
        children: [],
        location: { name: "", province: "" },
        biography: ""
    });

    // Helper states
    const [spousesList, setSpousesList] = useState<string[]>(initialData?.spouses || []);
    const [locationInput, setLocationInput] = useState(initialData?.location?.name || "");
    const [provinceInput, setProvinceInput] = useState(initialData?.location?.province || "");

    // Spouse Search State
    const [spouseSearchQuery, setSpouseSearchQuery] = useState("");
    const [showSpouseSearch, setShowSpouseSearch] = useState(false);

    // Potential fathers: Males from previous generation (approx)
    const potentialFathers = useMemo(() => {
        return allMembers.filter(m => m.gender === Gender.Male && m.generation === formData.generation - 1);
    }, [allMembers, formData.generation]);

    // Spouse Search Logic
    const spouseSearchResults = useMemo(() => {
        if (!spouseSearchQuery) return [];
        const results: { member: Person, familyName: string, familyHall: string }[] = [];
        
        allFamilies.forEach(family => {
            family.members.forEach(member => {
                // Filter logic: Match name, exclude self, optionally filter gender if desired (skipped for flexibility)
                if (member.id !== formData.id && 
                   (member.surname + member.givenName).includes(spouseSearchQuery)) {
                    results.push({
                        member: member,
                        familyName: family.info.surname,
                        familyHall: family.info.hallName
                    });
                }
            });
        });
        return results;
    }, [allFamilies, spouseSearchQuery, formData.id]);

    const addSpouse = (name: string) => {
        if (name && !spousesList.includes(name)) {
            setSpousesList([...spousesList, name]);
        }
        setSpouseSearchQuery("");
        setShowSpouseSearch(false);
    };

    const removeSpouse = (indexToRemove: number) => {
        setSpousesList(spousesList.filter((_, i) => i !== indexToRemove));
    };

    const handleSubmit = () => {
        const finalData: Person = {
            ...formData,
            spouses: spousesList,
            location: { 
                name: locationInput, 
                province: provinceInput,
                coordinates: initialData?.location?.coordinates // Preserve coords if editing
            }
        };
        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-[#f4f1ea] w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border-2 border-[#5d4037]">
                {/* Header */}
                <div className="bg-[#2c2c2c] text-[#f4f1ea] p-4 flex justify-between items-center shadow-md">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                        <Edit2 className="w-5 h-5" />
                        {initialData ? "编辑成员 (Edit Member)" : "新增成员 (Add Member)"}
                    </h3>
                    <button onClick={onClose}><X className="w-6 h-6 hover:text-red-400" /></button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Identity */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-[#8b0000] border-b border-[#8b0000]/30 pb-2 mb-4">基本信息 (Identity)</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">姓 (Surname)</label>
                                <input 
                                    className="w-full border p-2 rounded bg-stone-100 font-bold" 
                                    value={formData.surname} 
                                    onChange={e => setFormData({...formData, surname: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">名 (Given Name)</label>
                                <input 
                                    className="w-full border p-2 rounded focus:ring-2 ring-[#8b0000]/30 outline-none" 
                                    value={formData.givenName} 
                                    onChange={e => setFormData({...formData, givenName: e.target.value})}
                                    placeholder="如: 崇文"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">字 (Courtesy Name)</label>
                                <input 
                                    className="w-full border p-2 rounded focus:ring-2 ring-[#8b0000]/30 outline-none" 
                                    value={formData.courtesyName || ""} 
                                    onChange={e => setFormData({...formData, courtesyName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">号 (Art Name)</label>
                                <input 
                                    className="w-full border p-2 rounded focus:ring-2 ring-[#8b0000]/30 outline-none" 
                                    value={formData.artName || ""} 
                                    onChange={e => setFormData({...formData, artName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#5d4037] mb-2">性别 (Gender)</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="gender" 
                                        checked={formData.gender === Gender.Male} 
                                        onChange={() => setFormData({...formData, gender: Gender.Male})} 
                                    />
                                    <span className="bg-stone-200 px-3 py-1 rounded text-sm">男 (Male)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="gender" 
                                        checked={formData.gender === Gender.Female} 
                                        onChange={() => setFormData({...formData, gender: Gender.Female})} 
                                    />
                                    <span className="bg-stone-200 px-3 py-1 rounded text-sm">女 (Female)</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">世系 (Generation)</label>
                                <input 
                                    type="number"
                                    className="w-full border p-2 rounded focus:ring-2 ring-[#8b0000]/30 outline-none" 
                                    value={formData.generation} 
                                    onChange={e => setFormData({...formData, generation: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">字辈 (Gen. Name)</label>
                                <input 
                                    className="w-full border p-2 rounded focus:ring-2 ring-[#8b0000]/30 outline-none" 
                                    value={formData.generationName} 
                                    onChange={e => setFormData({...formData, generationName: e.target.value})}
                                    placeholder="如: 国"
                                />
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">生年 (Birth Year)</label>
                                <input 
                                    type="number"
                                    className="w-full border p-2 rounded focus:ring-2 ring-[#8b0000]/30 outline-none" 
                                    value={formData.birthYear} 
                                    onChange={e => setFormData({...formData, birthYear: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">卒年 (Death Year)</label>
                                <input 
                                    type="number"
                                    className="w-full border p-2 rounded focus:ring-2 ring-[#8b0000]/30 outline-none" 
                                    value={formData.deathYear || ""} 
                                    onChange={e => setFormData({...formData, deathYear: e.target.value ? parseInt(e.target.value) : undefined})}
                                    placeholder="在世不填"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Relationships & Bio */}
                    <div className="space-y-6">
                         <h4 className="font-bold text-[#8b0000] border-b border-[#8b0000]/30 pb-2 mb-4">家族关系 (Relationships)</h4>
                         
                         <div>
                            <label className="block text-xs font-bold text-[#5d4037] mb-1">父亲 (Father)</label>
                            <select 
                                className="w-full border p-2 rounded focus:ring-2 ring-[#8b0000]/30 outline-none" 
                                value={formData.fatherId || ""}
                                onChange={e => setFormData({...formData, fatherId: e.target.value})}
                            >
                                <option value="">-- 选择父亲 (上一世系) --</option>
                                {potentialFathers.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.generation}世 {f.surname}{f.givenName} ({f.birthYear})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-stone-400 mt-1">自动关联至父系关系图谱。</p>
                         </div>

                         <div>
                            <label className="block text-xs font-bold text-[#5d4037] mb-2">配偶 (Spouses)</label>
                            
                            {/* Selected Spouses Tags */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {spousesList.map((spouse, idx) => (
                                    <div key={idx} className="bg-[#fff5f5] border border-[#8b0000]/30 text-[#8b0000] px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                        <Heart className="w-3 h-3 fill-current" />
                                        {spouse}
                                        <button onClick={() => removeSpouse(idx)} className="hover:text-red-800"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setShowSpouseSearch(true)}
                                    className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-stone-300 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> 添加配偶
                                </button>
                            </div>

                            {/* Spouse Search Dropdown */}
                            {showSpouseSearch && (
                                <div className="relative mt-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center border rounded p-2 bg-white focus-within:ring-2 ring-[#8b0000]/30">
                                        <Search className="w-4 h-4 text-stone-400 mr-2" />
                                        <input 
                                            className="flex-1 outline-none text-sm"
                                            placeholder="搜索全平台家族成员或直接输入姓名..."
                                            value={spouseSearchQuery}
                                            onChange={e => setSpouseSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => setShowSpouseSearch(false)} className="ml-2 text-stone-400 hover:text-stone-600"><X className="w-4 h-4"/></button>
                                    </div>
                                    
                                    <div className="absolute w-full bg-white border shadow-lg rounded mt-1 max-h-48 overflow-y-auto z-50">
                                        {/* Dynamic Search Results */}
                                        {spouseSearchResults.map((res, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => addSpouse(`${res.member.surname}${res.member.givenName} (${res.familyName}氏${res.familyHall})`)}
                                                className="p-2 hover:bg-[#fff5f5] cursor-pointer border-b border-stone-100 flex justify-between items-center group"
                                            >
                                                <div>
                                                    <div className="font-bold text-[#2c2c2c] group-hover:text-[#8b0000]">
                                                        {res.member.surname}{res.member.givenName}
                                                    </div>
                                                    <div className="text-xs text-stone-500">
                                                        {res.familyName}氏 · {res.familyHall} · {res.member.generation}世
                                                    </div>
                                                </div>
                                                <div className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-500 group-hover:bg-[#8b0000] group-hover:text-white transition-colors">
                                                    选择
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Manual Entry Option */}
                                        {spouseSearchQuery && (
                                            <div 
                                                onClick={() => addSpouse(spouseSearchQuery)}
                                                className="p-2 hover:bg-stone-50 cursor-pointer text-stone-600 italic text-sm border-t flex items-center gap-2"
                                            >
                                                <Plus className="w-3 h-3" />
                                                直接添加 "{spouseSearchQuery}" (非系统成员)
                                            </div>
                                        )}

                                        {!spouseSearchQuery && (
                                            <div className="p-3 text-xs text-stone-400 text-center">请输入姓名查找...</div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <p className="text-xs text-stone-400 mt-1">可搜索其他家族已录入成员，实现家族联姻记录。</p>
                         </div>

                         <h4 className="font-bold text-[#8b0000] border-b border-[#8b0000]/30 pb-2 mb-4 mt-8">生平详情 (Details)</h4>

                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">定居地 (Location)</label>
                                <input 
                                    className="w-full border p-2 rounded" 
                                    value={locationInput}
                                    onChange={e => setLocationInput(e.target.value)}
                                    placeholder="城市/村庄"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-[#5d4037] mb-1">省份 (Province)</label>
                                <input 
                                    className="w-full border p-2 rounded" 
                                    value={provinceInput}
                                    onChange={e => setProvinceInput(e.target.value)}
                                    placeholder="省份"
                                />
                             </div>
                         </div>

                         <div>
                            <label className="block text-xs font-bold text-[#5d4037] mb-1">传记 (Biography)</label>
                            <textarea 
                                className="w-full border p-2 rounded h-32 focus:ring-2 ring-[#8b0000]/30 outline-none"
                                value={formData.biography || ""}
                                onChange={e => setFormData({...formData, biography: e.target.value})}
                                placeholder="简述生平事迹、功名、职业等..."
                            />
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-stone-100 border-t flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 rounded border border-stone-300 text-stone-600 hover:bg-stone-200 transition-colors">取消</button>
                    <button onClick={handleSubmit} className="px-8 py-2 rounded bg-[#8b0000] text-white hover:bg-red-900 transition-colors shadow-lg flex items-center gap-2">
                        <Save className="w-4 h-4" /> 保存信息
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Family App Views (The "Inner" App) ---

const FamilyHome = ({ family, onNavigate }: { family: Family, onNavigate: (p: string) => void }) => (
    <div className="container mx-auto px-4 max-w-5xl space-y-8 animate-in fade-in">
        <div className="relative h-[400px] w-full bg-[#e8e4d9] overflow-hidden flex flex-col items-center justify-center text-center border-y-4 border-double border-[#5d4037]/30">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]"></div>
            <div className="z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-stone-800 rounded-full flex items-center justify-center text-white text-5xl font-calligraphy mb-6 shadow-xl ring-4 ring-[#8b0000]/30">
                    {family.info.surname}
                </div>
                <h1 className="text-5xl font-serif text-[#2c2c2c] mb-2">{family.info.surname}氏宗族</h1>
                <p className="text-xl text-[#5d4037] font-light tracking-[0.3em] mb-6">{family.info.hallName}</p>
                <div className="flex gap-2">
                    <Stamp text="源远" />
                    <Stamp text="流长" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
             <div className="md:col-span-1">
                 <Card className="h-full flex flex-col items-center justify-center bg-[#2c2c2c] text-[#f4f1ea]">
                    <h3 className="font-calligraphy text-2xl mb-4 border-b border-stone-600 pb-2">家训</h3>
                    <div className="vertical-text h-64 text-lg font-light tracking-widest leading-loose">
                        {family.info.motto}
                    </div>
                 </Card>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                 <button onClick={() => onNavigate('tree')} className="group p-6 bg-white border border-stone-200 hover:border-[#8b0000] transition-colors shadow-sm flex flex-col items-center justify-center text-center">
                    <GitGraph className="w-10 h-10 text-[#5d4037] mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-serif">浏览族谱</span>
                 </button>
                 <button onClick={() => onNavigate('members')} className="group p-6 bg-white border border-stone-200 hover:border-[#8b0000] transition-colors shadow-sm flex flex-col items-center justify-center text-center">
                    <Users className="w-10 h-10 text-[#5d4037] mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-serif">家族成员</span>
                 </button>
                 <button onClick={() => onNavigate('relationship')} className="group p-6 bg-white border border-stone-200 hover:border-[#8b0000] transition-colors shadow-sm flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-10 h-10 text-[#5d4037] mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-serif">关系计算</span>
                 </button>
                 <button onClick={() => onNavigate('history')} className="group p-6 bg-white border border-stone-200 hover:border-[#8b0000] transition-colors shadow-sm flex flex-col items-center justify-center text-center">
                    <MapIcon className="w-10 h-10 text-[#5d4037] mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-serif">迁徙地图</span>
                 </button>
            </div>
        </div>
        
        <Card className="mb-12">
            <h3 className="text-2xl font-serif font-bold mb-4">关于本支</h3>
            <p className="text-stone-700 leading-relaxed mb-4 text-justify">
                始祖 {family.info.ancestor} 公，源于 {family.info.origin}。{family.info.surname}氏一脉，薪火相传。
            </p>
            <div className="p-4 bg-stone-100 rounded border-l-4 border-[#8b0000]">
                <p className="font-bold text-[#5d4037] mb-2">字辈诗</p>
                <p className="font-serif italic text-lg text-stone-600">{family.info.generationPoem}</p>
            </div>
        </Card>
    </div>
);

const FamilyTree = ({ family, onSelectMember }: { family: Family, onSelectMember: (m: Person) => void }) => {
    const roots = family.members.filter(m => m.generation === 1);
    return (
        <div className="h-full overflow-auto bg-[#e8e4d9] p-10 cursor-move">
             <SectionTitle title="家族世系图" sub="Genealogy Tree" />
             <div className="flex justify-center min-w-max">
                 {roots.map(root => (
                     <TreeNode key={root.id} memberId={root.id} allMembers={family.members} onSelect={onSelectMember} />
                 ))}
             </div>
        </div>
    );
};

const FamilyMembers = ({ 
    family, 
    onSelectMember, 
    onAdd, 
    onEdit, 
    onDelete 
}: { 
    family: Family, 
    onSelectMember: (m: Person) => void,
    onAdd: () => void,
    onEdit: (m: Person) => void,
    onDelete: (id: string) => void
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const filteredMembers = family.members.filter(m => 
        (m.surname + m.givenName).includes(searchTerm) || 
        m.generationName.includes(searchTerm)
    );
    return (
        <div className="container mx-auto px-4 max-w-5xl py-8">
            <SectionTitle title="宗族成员" sub="Family Members" />
            
            {/* Search & Filter Bar */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-3 text-stone-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="搜索姓名、字辈..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[#5d4037] focus:outline-none focus:ring-2 focus:ring-[#8b0000]/50 rounded-sm font-serif placeholder-stone-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={onAdd}
                    className="flex items-center gap-2 bg-[#8b0000] text-white px-4 py-2 rounded shadow-md hover:bg-red-900 transition-colors"
                >
                    <UserPlus className="w-5 h-5" /> 新增成员
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredMembers.map(member => (
                    <div key={member.id} className="group bg-white border border-stone-200 hover:border-[#8b0000] transition-all shadow-sm hover:shadow-md relative flex flex-col">
                        <div 
                            onClick={() => onSelectMember(member)}
                            className="p-4 cursor-pointer flex-1"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center overflow-hidden border border-stone-300">
                                    {member.portrait ? <img src={member.portrait} alt="" className="w-full h-full object-cover" /> : <User className="text-stone-400 w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-[#2c2c2c] group-hover:text-[#8b0000]">{member.surname}{member.givenName}</h4>
                                    <p className="text-xs text-[#5d4037]">{member.generation}世 | {member.generationName}字辈</p>
                                </div>
                            </div>
                            <div className="text-xs text-stone-500 mt-2 space-y-1">
                                {member.courtesyName && <p>字: {member.courtesyName}</p>}
                                <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {member.birthYear} - {member.deathYear || "至今"}</p>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="border-t border-stone-100 p-2 flex justify-end gap-2 bg-stone-50/50">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(member); }}
                                className="p-1.5 text-stone-500 hover:text-[#5d4037] hover:bg-stone-200 rounded"
                                title="编辑"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(member.id); }}
                                className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="删除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. Relationship AI
const RelationshipPage = ({ family }: { family: Family }) => {
    const [personA, setPersonA] = useState<string>("");
    const [personB, setPersonB] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ title: string; explanation: string; wufu?: string } | null>(null);

    const handleAnalyze = async () => {
        if (!personA || !personB) return;
        setLoading(true);
        setResult(null);
        const pA = family.members.find(m => m.id === personA);
        const pB = family.members.find(m => m.id === personB);
        if (pA && pB) {
            try {
                if (process.env.API_KEY) {
                     const jsonStr = await analyzeRelationship(pA, pB, family.members);
                     const data = JSON.parse(jsonStr || "{}");
                     setResult(data);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const genDiff = Math.abs(pA.generation - pB.generation);
                    setResult({
                        title: genDiff === 0 ? "同辈宗亲" : "叔侄宗亲",
                        explanation: `基于世系分析: 相差 ${genDiff} 代`,
                        wufu: genDiff < 5 ? "五服之内" : "五服之外"
                    });
                }
            } catch (e) {
                setResult({ title: "分析失败", explanation: "请重试", wufu: "" });
            }
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto px-4 max-w-3xl py-12">
            <SectionTitle title="亲缘关系推演" sub="AI Relationship Calculator" />
            <Card className="bg-white/80">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                     <select className="flex-1 p-2 border" value={personA} onChange={e => setPersonA(e.target.value)}>
                         <option value="">选择成员 A</option>
                         {family.members.map(m => <option key={m.id} value={m.id}>{m.generation}世 - {m.surname}{m.givenName}</option>)}
                     </select>
                     <select className="flex-1 p-2 border" value={personB} onChange={e => setPersonB(e.target.value)}>
                         <option value="">选择成员 B</option>
                         {family.members.map(m => <option key={m.id} value={m.id}>{m.generation}世 - {m.surname}{m.givenName}</option>)}
                     </select>
                </div>
                <div className="text-center">
                    <button onClick={handleAnalyze} disabled={loading} className="px-6 py-2 bg-[#2c2c2c] text-white rounded-sm">{loading ? "计算中..." : "推演"}</button>
                </div>
            </Card>
            {result && (
                <div className="mt-8 bg-[#fff5f5] border border-[#8b0000] p-6 text-center animate-in slide-in-from-bottom-2">
                    <h3 className="text-2xl font-bold text-[#8b0000] mb-2">{result.title}</h3>
                    <p className="text-stone-600">{result.explanation}</p>
                </div>
            )}
        </div>
    );
};

const MigrationMap = ({ members }: { members: Person[] }) => {
    // Fixed China bounds approximation for visualization
    const bounds = { minLng: 73, maxLng: 136, minLat: 18, maxLat: 54 };

    const project = (lat: number, lng: number) => {
        const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
        // Adjust y for simple equirectangular projection approximation on this specific map image
        const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
        return { x, y };
    };

    // Collect paths: connect parent to child
    const paths: {x1: number, y1: number, x2: number, y2: number, key: string}[] = [];
    const points: {x: number, y: number, member: Person, key: string}[] = [];

    members.forEach(m => {
        if (m.location?.coordinates) {
            const { x, y } = project(m.location.coordinates.lat, m.location.coordinates.lng);
            // Filter out of bounds points (e.g. overseas) to keep map clean
            if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
                points.push({ x, y, member: m, key: m.id });

                if (m.fatherId) {
                    const father = members.find(f => f.id === m.fatherId);
                    if (father && father.location?.coordinates) {
                        // Only draw if locations are different enough
                        if (father.location.name !== m.location.name) {
                            const start = project(father.location.coordinates.lat, father.location.coordinates.lng);
                             if (start.x >= 0 && start.x <= 100 && start.y >= 0 && start.y <= 100) {
                                paths.push({ x1: start.x, y1: start.y, x2: x, y2: y, key: `${father.id}-${m.id}` });
                             }
                        }
                    }
                }
            }
        }
    });

    return (
        <Card className="mb-12 overflow-hidden bg-[#e8e4d9] p-0 shadow-lg border-2 border-[#5d4037]/20">
             <div className="relative w-full aspect-[4/3] bg-[#a8c0dbd0]">
                {/* Background Map Image */}
                <div 
                    className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-40 mix-blend-multiply"
                    style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/China_administrative_divisions_navmap.svg/1200px-China_administrative_divisions_navmap.svg.png')" }}
                ></div>

                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <marker id="arrowhead" markerWidth="3" markerHeight="3" refX="2" refY="1.5" orient="auto">
                            <polygon points="0 0, 3 1.5, 0 3" fill="#8b0000" />
                        </marker>
                    </defs>
                    
                    {paths.map(p => (
                        <path 
                            key={p.key}
                            d={`M ${p.x1} ${p.y1} Q ${(p.x1+p.x2)/2} ${(p.y1+p.y2)/2 - 5} ${p.x2} ${p.y2}`}
                            fill="none"
                            stroke="#8b0000"
                            strokeWidth="0.4"
                            strokeDasharray="1,1"
                            markerEnd="url(#arrowhead)"
                            className="opacity-60"
                        />
                    ))}

                    {points.map(p => (
                        <g key={p.key} className="group cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="1.5" fill="#5d4037" className="group-hover:fill-[#8b0000] transition-colors shadow-sm" />
                            <circle cx={p.x} cy={p.y} r="3" fill="none" stroke="#5d4037" strokeWidth="0.1" className="animate-ping opacity-30" />
                            
                            <foreignObject x={p.x - 10} y={p.y + 2} width="20" height="20" className="overflow-visible pointer-events-none">
                                <div className="text-[2.5px] text-center font-bold text-[#2c2c2c] bg-white/80 rounded-[1px] px-0.5 w-max mx-auto shadow-sm whitespace-nowrap border border-[#5d4037]/20">
                                    {p.member.location?.name}
                                </div>
                            </foreignObject>
                            
                            <title>{p.member.generation}世 {p.member.surname}{p.member.givenName} ({p.member.location?.name})</title>
                        </g>
                    ))}
                </svg>
                
                <div className="absolute top-4 right-4 bg-white/80 p-2 rounded shadow text-xs border border-[#5d4037]/20">
                     <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-[#5d4037]"></div> 定居点 (Settlement)</div>
                     <div className="flex items-center gap-2"><div className="w-4 h-0.5 border-t border-dashed border-[#8b0000]"></div> 迁徙路径 (Migration)</div>
                </div>
             </div>
        </Card>
    );
};

const HistoryPage = ({ family }: { family: Family }) => (
    <div className="container mx-auto px-4 max-w-4xl py-12">
        <SectionTitle title="家族迁徙图" sub="Migration Map" />
        <MigrationMap members={family.members} />
        
        <div className="h-12 border-b border-[#5d4037]/20 mb-12"></div>

        <SectionTitle title="家族大事记" sub="Chronicle" />
        <div className="relative border-l-2 border-[#5d4037]/30 ml-6 space-y-8">
            {family.events.map((event, index) => (
                <div key={index} className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-[#f4f1ea] border-2 border-[#8b0000] rounded-full"></div>
                    <div className="bg-white p-4 shadow-sm border border-stone-200">
                        <span className="text-[#8b0000] font-bold block mb-1">{event.year}年</span>
                        <h4 className="font-bold text-lg mb-1">{event.title}</h4>
                        <p className="text-stone-600">{event.description}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- Platform / Portal Components ---

const PortalHome = ({ 
    surnames, regions, families, 
    onManageSurnames, onManageRegions, onSelectFamily, onCreateFamily, onGlobalRelationship
}: {
    surnames: SurnameData[], regions: Region[], families: Family[],
    onManageSurnames: () => void, onManageRegions: () => void,
    onSelectFamily: (id: string) => void, onCreateFamily: () => void,
    onGlobalRelationship: () => void
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFamilies = families.filter(f => 
        f.info.surname.includes(searchQuery) || 
        f.info.hallName.includes(searchQuery) ||
        f.info.ancestor.includes(searchQuery)
    );

    return (
        <div className="min-h-screen bg-[#e8e4d9] flex flex-col items-center py-20 animate-in fade-in">
             <div className="text-center mb-12">
                 <div className="w-24 h-24 mx-auto bg-[#2c2c2c] rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-[#5d4037]">
                     <BookOpen className="w-10 h-10 text-[#f4f1ea]" />
                 </div>
                 <h1 className="text-6xl font-serif text-[#2c2c2c] mb-4">传承</h1>
                 <p className="text-xl text-[#5d4037] tracking-[0.5em] uppercase">Digital Genealogy Platform</p>
             </div>

             <div className="max-w-6xl w-full px-4 space-y-12">
                 
                 {/* 1. Global Search */}
                 <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-4 text-stone-400 w-6 h-6" />
                    <input 
                        type="text" 
                        placeholder="搜索宗族、堂号、始祖..."
                        className="w-full pl-14 pr-6 py-4 bg-white rounded shadow-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#8b0000] text-lg font-serif"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {/* 2. Platform Tools */}
                     <div className="space-y-4">
                         <h3 className="text-xl font-bold text-[#5d4037] border-b pb-2 mb-4">平台功能 (Platform Tools)</h3>
                         
                         <div className="grid grid-cols-2 gap-4">
                             <button onClick={onManageSurnames} className="bg-white p-4 rounded shadow-sm border border-stone-200 hover:border-[#8b0000] text-center group transition-all">
                                 <BookOpen className="w-8 h-8 mx-auto text-[#5d4037] mb-2 group-hover:scale-110 transition-transform" />
                                 <span className="font-bold text-stone-700 block">姓氏库</span>
                                 <span className="text-xs text-stone-400">{surnames.length} 姓</span>
                             </button>

                             <button onClick={onManageRegions} className="bg-white p-4 rounded shadow-sm border border-stone-200 hover:border-[#8b0000] text-center group transition-all">
                                 <Globe className="w-8 h-8 mx-auto text-[#5d4037] mb-2 group-hover:scale-110 transition-transform" />
                                 <span className="font-bold text-stone-700 block">地区管理</span>
                                 <span className="text-xs text-stone-400">{regions.length} 地</span>
                             </button>
                         </div>

                         <button onClick={onGlobalRelationship} className="w-full bg-[#2c2c2c] p-6 rounded shadow-sm border border-stone-600 hover:bg-black text-left group transition-all relative overflow-hidden">
                             <div className="relative z-10 flex justify-between items-center">
                                 <div>
                                     <h4 className="text-lg font-bold text-[#f4f1ea] flex items-center gap-2">
                                         <Network className="w-5 h-5" /> 跨家族寻亲
                                     </h4>
                                     <p className="text-xs text-stone-400 mt-1">Global Relationship Search</p>
                                 </div>
                                 <ArrowRight className="text-stone-500 group-hover:text-white transition-colors" />
                             </div>
                         </button>

                         <button className="w-full bg-stone-100 p-4 rounded border border-dashed border-stone-300 text-left flex items-center gap-4 opacity-70 cursor-not-allowed">
                             <div className="bg-stone-200 p-2 rounded-full">
                                 <Dna className="w-5 h-5 text-stone-500" />
                             </div>
                             <div>
                                 <h4 className="font-bold text-stone-500">DNA 溯源 (Coming Soon)</h4>
                                 <p className="text-xs text-stone-400">科学验证血脉关联</p>
                             </div>
                         </button>
                     </div>

                     {/* 3. Family List */}
                     <div className="md:col-span-2">
                         <div className="flex justify-between items-end border-b pb-2 mb-4 border-[#5d4037]/20">
                            <h3 className="text-xl font-bold text-[#5d4037]">家族列表 (Families)</h3>
                            <button onClick={onCreateFamily} className="text-sm flex items-center gap-1 bg-[#8b0000] text-white px-3 py-1 rounded hover:bg-red-900 transition-colors">
                                <Plus className="w-4 h-4" /> 创建新家族
                            </button>
                         </div>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {filteredFamilies.map(family => (
                                 <div key={family.id} onClick={() => onSelectFamily(family.id)} className="bg-white p-6 rounded shadow-md border-l-4 border-[#8b0000] cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                         <span className="font-calligraphy text-8xl text-[#5d4037]">{family.info.surname}</span>
                                     </div>
                                     <div className="relative z-10">
                                         <div className="flex items-center gap-2 mb-2">
                                             <span className="bg-[#2c2c2c] text-white text-xs px-2 py-1 rounded-sm">{family.info.hallName}</span>
                                             <span className="text-xs text-stone-500">{new Date(family.createdAt).getFullYear()}年建</span>
                                         </div>
                                         <h4 className="text-2xl font-bold text-[#2c2c2c] mb-1">{family.info.surname}氏宗族</h4>
                                         <p className="text-sm text-stone-600 mb-4">始祖: {family.info.ancestor} | 成员: {family.members.length}人</p>
                                         <div className="text-xs text-[#8b0000] flex items-center font-bold">
                                             进入族谱 <ArrowRight className="w-3 h-3 ml-1" />
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {filteredFamilies.length === 0 && (
                                 <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-300 rounded text-stone-400">
                                     <p>{searchQuery ? "未找到匹配的家族" : "暂无家族，请点击右上角创建。"}</p>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const GlobalRelationshipPage = ({ families, onBack }: { families: Family[], onBack: () => void }) => {
    const [famAId, setFamAId] = useState("");
    const [memAId, setMemAId] = useState("");
    const [famBId, setFamBId] = useState("");
    const [memBId, setMemBId] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ title: string; explanation: string; wufu?: string } | null>(null);

    const famA = families.find(f => f.id === famAId);
    const famB = families.find(f => f.id === famBId);
    
    const memA = famA?.members.find(m => m.id === memAId);
    const memB = famB?.members.find(m => m.id === memBId);

    const allContextMembers = useMemo(() => {
        return families.flatMap(f => f.members);
    }, [families]);

    const handleAnalyze = async () => {
        if (!memA || !memB) return;
        setLoading(true);
        setResult(null);

        try {
            if (process.env.API_KEY) {
                const jsonStr = await analyzeRelationship(memA, memB, allContextMembers);
                const data = JSON.parse(jsonStr || "{}");
                setResult(data);
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Mock result for cross-family
                setResult({
                    title: "宗亲",
                    explanation: `AI分析：虽然${memA.surname}${memA.givenName}与${memB.surname}${memB.givenName}分属不同记载的家族分支（${famA?.info.hallName} vs ${famB?.info.hallName}），但根据辈分与姓氏起源推断，二者可能同源。`,
                    wufu: "五服之外"
                });
            }
        } catch (e) {
            setResult({ title: "分析失败", explanation: "AI服务暂时不可用。", wufu: "" });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#f4f1ea] animate-in fade-in flex flex-col">
            <header className="bg-[#2c2c2c] text-white p-4 flex items-center gap-4 sticky top-0 shadow-md z-10">
                <button onClick={onBack}><ArrowRight className="w-6 h-6 rotate-180" /></button>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Network className="w-5 h-5" /> 跨家族寻亲 (Global Search)
                </h2>
            </header>

            <div className="container mx-auto p-4 md:p-12 max-w-5xl flex-grow">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-[#5d4037] mb-2">全平台关系推演</h1>
                    <p className="text-stone-500">Connecting lineages across different family books.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative">
                    {/* Connector Line for Desktop */}
                    <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-[#f4f1ea] p-2 border-2 border-[#8b0000] rounded-full">
                        <Sparkles className="w-6 h-6 text-[#8b0000]" />
                    </div>

                    {/* Person A Selector */}
                    <Card className="bg-white">
                        <h3 className="font-bold text-lg mb-4 text-[#5d4037] border-b pb-2">寻亲者 A</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">选择家族 (Family)</label>
                                <select className="w-full border p-2 rounded" value={famAId} onChange={e => { setFamAId(e.target.value); setMemAId(""); }}>
                                    <option value="">-- 选择家族 --</option>
                                    {families.map(f => <option key={f.id} value={f.id}>{f.info.surname}氏 ({f.info.hallName})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">选择成员 (Member)</label>
                                <select className="w-full border p-2 rounded" value={memAId} onChange={e => setMemAId(e.target.value)} disabled={!famAId}>
                                    <option value="">-- 选择成员 --</option>
                                    {famA?.members.map(m => <option key={m.id} value={m.id}>{m.generation}世 {m.surname}{m.givenName}</option>)}
                                </select>
                            </div>
                            {memA && (
                                <div className="mt-4 p-4 bg-stone-50 rounded border flex items-center gap-4">
                                     <div className="w-12 h-12 bg-stone-200 rounded-full overflow-hidden">
                                         <img src={memA.portrait || "https://picsum.photos/200"} className="w-full h-full object-cover grayscale" />
                                     </div>
                                     <div>
                                         <div className="font-bold">{memA.surname}{memA.givenName}</div>
                                         <div className="text-xs text-stone-500">{memA.location?.province} | {memA.generationName}字辈</div>
                                     </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Person B Selector */}
                    <Card className="bg-white">
                        <h3 className="font-bold text-lg mb-4 text-[#5d4037] border-b pb-2">寻亲者 B</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">选择家族 (Family)</label>
                                <select className="w-full border p-2 rounded" value={famBId} onChange={e => { setFamBId(e.target.value); setMemBId(""); }}>
                                    <option value="">-- 选择家族 --</option>
                                    {families.map(f => <option key={f.id} value={f.id}>{f.info.surname}氏 ({f.info.hallName})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">选择成员 (Member)</label>
                                <select className="w-full border p-2 rounded" value={memBId} onChange={e => setMemBId(e.target.value)} disabled={!famBId}>
                                    <option value="">-- 选择成员 --</option>
                                    {famB?.members.map(m => <option key={m.id} value={m.id}>{m.generation}世 {m.surname}{m.givenName}</option>)}
                                </select>
                            </div>
                            {memB && (
                                <div className="mt-4 p-4 bg-stone-50 rounded border flex items-center gap-4">
                                     <div className="w-12 h-12 bg-stone-200 rounded-full overflow-hidden">
                                         <img src={memB.portrait || "https://picsum.photos/201"} className="w-full h-full object-cover grayscale" />
                                     </div>
                                     <div>
                                         <div className="font-bold">{memB.surname}{memB.givenName}</div>
                                         <div className="text-xs text-stone-500">{memB.location?.province} | {memB.generationName}字辈</div>
                                     </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="text-center mb-12">
                     <button 
                        onClick={handleAnalyze} 
                        disabled={loading || !memA || !memB}
                        className="bg-[#8b0000] text-white text-lg px-8 py-3 rounded shadow-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                    >
                        {loading ? "AI 正在查阅史料..." : "开始推演关系"}
                     </button>
                </div>

                {result && (
                    <div className="max-w-2xl mx-auto bg-white border-2 border-[#8b0000] p-8 relative shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#8b0000] text-white px-4 py-1 font-bold text-sm uppercase tracking-widest shadow">
                            Analysis Result
                        </div>
                        <div className="text-center">
                            <h2 className="text-4xl font-calligraphy text-[#2c2c2c] mb-4">{result.title}</h2>
                            {result.wufu && <span className="inline-block bg-stone-100 text-stone-600 px-3 py-1 text-xs mb-6 rounded-full">{result.wufu}</span>}
                            <div className="text-left bg-[#f4f1ea] p-6 rounded border border-stone-200">
                                <p className="text-stone-700 leading-relaxed font-serif text-lg">
                                    {result.explanation}
                                </p>
                            </div>
                            <div className="mt-6 flex justify-center gap-4">
                                <button className="flex items-center gap-2 text-[#5d4037] text-sm hover:underline">
                                    <Share2 className="w-4 h-4" /> 分享结果
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

const SurnameFormModal = ({ 
    initialData, onClose, onSave 
}: { 
    initialData?: SurnameData, onClose: () => void, onSave: (data: SurnameData) => void 
}) => {
    const [formData, setFormData] = useState<SurnameData>(initialData || {
        character: "",
        pinyin: "",
        origin: "",
        totemDescription: "",
        halls: [],
        famousAncestors: [],
        distribution: ""
    });
    const [ancestorsInput, setAncestorsInput] = useState(initialData?.famousAncestors?.join("、") || "");

    const handleSubmit = () => {
        const updated = {
            ...formData,
            famousAncestors: ancestorsInput.split(/[,，、]/).map(s => s.trim()).filter(s => s)
        };
        onSave(updated);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-[#2c2c2c] text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{initialData ? "编辑姓氏" : "新增姓氏"} (Edit Surname)</h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-[#5d4037] mb-1">姓氏 (Character)</label>
                            <input 
                                className="w-full border p-2 rounded text-lg font-bold" 
                                value={formData.character} 
                                onChange={e => setFormData({...formData, character: e.target.value})}
                                disabled={!!initialData} // Disable editing key if updating
                                placeholder="如: 李"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#5d4037] mb-1">拼音 (Pinyin)</label>
                            <input 
                                className="w-full border p-2 rounded" 
                                value={formData.pinyin} 
                                onChange={e => setFormData({...formData, pinyin: e.target.value})}
                                placeholder="如: Lǐ"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#5d4037] mb-1">起源 (Origin)</label>
                        <textarea 
                            className="w-full border p-2 rounded h-24" 
                            value={formData.origin} 
                            onChange={e => setFormData({...formData, origin: e.target.value})}
                            placeholder="简述姓氏起源..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#5d4037] mb-1">图腾描述 (Totem)</label>
                        <textarea 
                            className="w-full border p-2 rounded h-20" 
                            value={formData.totemDescription || ""} 
                            onChange={e => setFormData({...formData, totemDescription: e.target.value})}
                            placeholder="描述姓氏图腾的含义..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#5d4037] mb-1">地理分布 (Distribution)</label>
                         <textarea 
                            className="w-full border p-2 rounded h-20" 
                            value={formData.distribution || ""} 
                            onChange={e => setFormData({...formData, distribution: e.target.value})}
                            placeholder="主要分布省份及现状..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#5d4037] mb-1">历史名人 (Famous Ancestors)</label>
                        <input 
                            className="w-full border p-2 rounded" 
                            value={ancestorsInput} 
                            onChange={e => setAncestorsInput(e.target.value)}
                            placeholder="如: 李白、李世民 (用逗号分隔)"
                        />
                    </div>
                </div>
                <div className="p-4 bg-stone-50 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-200 rounded">取消</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-[#8b0000] text-white rounded hover:bg-red-900 flex items-center gap-2">
                        <Save className="w-4 h-4" /> 保存
                    </button>
                </div>
            </div>
        </div>
    );
};

const SurnameManager = ({ 
    surnames, setSurnames, onBack 
}: { 
    surnames: SurnameData[], setSurnames: React.Dispatch<React.SetStateAction<SurnameData[]>>, onBack: () => void 
}) => {
    const [selectedSurname, setSelectedSurname] = useState<SurnameData | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingData, setEditingData] = useState<SurnameData | undefined>(undefined);
    const [newHallName, setNewHallName] = useState("");

    const handleOpenCreate = () => {
        setEditingData(undefined);
        setShowFormModal(true);
    };

    const handleOpenEdit = () => {
        if (selectedSurname) {
            setEditingData(selectedSurname);
            setShowFormModal(true);
        }
    };

    const handleSaveSurname = (data: SurnameData) => {
        if (editingData) {
            // Edit mode
            setSurnames(prev => prev.map(s => s.character === data.character ? data : s));
            setSelectedSurname(data);
        } else {
            // Create mode
            if (surnames.find(s => s.character === data.character)) {
                alert("该姓氏已存在");
                return;
            }
            setSurnames(prev => [...prev, data]);
        }
        setShowFormModal(false);
    };

    const handleAddHall = () => {
        if (!selectedSurname || !newHallName) return;
        const updated = { ...selectedSurname, halls: [...selectedSurname.halls, { name: newHallName, description: "新增堂号" }] };
        setSurnames(prev => prev.map(s => s.character === updated.character ? updated : s));
        setSelectedSurname(updated);
        setNewHallName("");
    };

    return (
        <div className="min-h-screen bg-[#f4f1ea] flex flex-col animate-in fade-in">
            <header className="bg-[#2c2c2c] text-white p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="hover:text-stone-300"><ArrowRight className="w-6 h-6 rotate-180" /></button>
                    <h2 className="text-xl font-bold">姓氏库管理 (Surname Library)</h2>
                </div>
                <button onClick={handleOpenCreate} className="bg-[#8b0000] px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-red-900">
                    <Plus className="w-4 h-4" /> 新增姓氏
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar List */}
                <div className="w-1/4 border-r border-stone-300 overflow-y-auto bg-white">
                    {surnames.map(s => (
                        <div 
                            key={s.character} 
                            onClick={() => setSelectedSurname(s)}
                            className={`p-4 border-b cursor-pointer flex justify-between items-center hover:bg-stone-50 ${selectedSurname?.character === s.character ? 'bg-stone-100 border-l-4 border-l-[#8b0000]' : ''}`}
                        >
                            <span className="font-bold text-lg">{s.character}</span>
                            <span className="text-xs text-stone-400">{s.halls.length}个堂号</span>
                        </div>
                    ))}
                </div>

                {/* Detail View */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {selectedSurname ? (
                        <div className="max-w-4xl mx-auto space-y-8">
                             {/* Header Card */}
                             <div className="bg-white p-8 rounded shadow-sm border border-stone-200 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                     <span className="text-9xl font-calligraphy">{selectedSurname.character}</span>
                                 </div>
                                 <div className="flex justify-between items-start mb-6 border-b pb-4 relative z-10">
                                     <div className="flex items-center gap-6">
                                         <div className="w-24 h-24 bg-[#2c2c2c] text-white flex items-center justify-center text-5xl font-calligraphy rounded shadow-lg ring-4 ring-[#8b0000]/20">
                                             {selectedSurname.character}
                                         </div>
                                         <div>
                                             <h3 className="text-3xl font-bold mb-1">{selectedSurname.character}姓</h3>
                                             <div className="flex items-center gap-2 text-stone-500">
                                                 <span className="bg-stone-100 px-2 py-0.5 rounded text-sm font-mono">{selectedSurname.pinyin || "Pinyin"}</span>
                                                 {selectedSurname.populationRank && <span className="text-xs">人口大约排名: 第{selectedSurname.populationRank}位</span>}
                                             </div>
                                         </div>
                                     </div>
                                     <button onClick={handleOpenEdit} className="bg-white border border-[#5d4037] text-[#5d4037] px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-[#5d4037] hover:text-white transition-colors">
                                         <Edit2 className="w-4 h-4" /> 编辑资料
                                     </button>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     <div>
                                         <h4 className="font-bold text-[#5d4037] mb-2 flex items-center gap-2">
                                             <Scroll className="w-4 h-4"/> 起源 (Origin)
                                         </h4>
                                         <p className="text-stone-600 leading-relaxed text-justify text-sm h-32 overflow-y-auto pr-2 custom-scrollbar">
                                             {selectedSurname.origin}
                                         </p>
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-[#5d4037] mb-2 flex items-center gap-2">
                                             <Flag className="w-4 h-4"/> 图腾 (Totem)
                                         </h4>
                                         <div className="bg-[#f4f1ea] p-3 rounded border border-stone-200 text-sm text-stone-700 h-32 overflow-y-auto">
                                             {selectedSurname.totemDescription || "暂无图腾描述"}
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Distribution Section (Visual Placeholder) */}
                             <div className="bg-white p-6 rounded shadow-sm border border-stone-200">
                                 <h4 className="font-bold text-[#5d4037] mb-4 flex items-center gap-2">
                                     <MapPin className="w-5 h-5" /> 地理分布 (Distribution)
                                 </h4>
                                 <div className="flex gap-6">
                                     {/* Fake Map Visualization */}
                                     <div className="w-1/3 bg-[#e8e4d9] rounded relative h-48 flex items-center justify-center border-2 border-dashed border-[#5d4037]/20 overflow-hidden">
                                         <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/China_administrative_divisions_navmap.svg/1200px-China_administrative_divisions_navmap.svg.png')] bg-cover bg-center grayscale"></div>
                                         <span className="relative z-10 bg-white/80 px-3 py-1 rounded shadow text-xs font-bold text-[#8b0000]">分布热力图</span>
                                     </div>
                                     <div className="w-2/3">
                                         <p className="text-stone-600 leading-relaxed mb-4 text-justify">
                                             {selectedSurname.distribution || "暂无详细分布数据。"}
                                         </p>
                                         <div className="flex flex-wrap gap-2">
                                             {["河南", "山东", "四川", "广东", "河北"].map(prov => (
                                                 <span key={prov} className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs hover:bg-[#8b0000] hover:text-white transition-colors cursor-default">
                                                     {prov}
                                                 </span>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Ancestors & Halls Grid */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 {/* Famous Ancestors */}
                                 <div className="bg-white p-6 rounded shadow-sm border border-stone-200">
                                     <h4 className="font-bold text-[#5d4037] mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5"/> 历史名人 (Ancestors)
                                     </h4>
                                     <div className="flex flex-wrap gap-2">
                                         {selectedSurname.famousAncestors && selectedSurname.famousAncestors.length > 0 ? (
                                             selectedSurname.famousAncestors.map((name, i) => (
                                                 <span key={i} className="px-3 py-1 bg-[#fff5f5] text-[#8b0000] border border-[#8b0000]/30 rounded text-sm font-serif font-bold">
                                                     {name}
                                                 </span>
                                             ))
                                         ) : (
                                             <span className="text-stone-400 text-sm">暂无录入</span>
                                         )}
                                     </div>
                                 </div>

                                 {/* Halls Management (Existing Logic improved) */}
                                 <div className="bg-white p-6 rounded shadow-sm border border-stone-200">
                                     <h4 className="font-bold text-[#5d4037] mb-4 flex items-center justify-between">
                                         <span className="flex items-center gap-2"><HomeIcon className="w-5 h-5"/> 堂号 (Halls)</span>
                                         <span className="text-xs bg-stone-100 px-2 py-1 rounded">{selectedSurname.halls.length}个</span>
                                     </h4>
                                     <div className="space-y-3 h-48 overflow-y-auto pr-1 custom-scrollbar mb-4">
                                         {selectedSurname.halls.map((h, i) => (
                                             <div key={i} className="p-3 bg-stone-50 rounded border border-stone-200 hover:border-[#8b0000] transition-colors group">
                                                 <div className="flex justify-between">
                                                     <div className="font-bold text-[#2c2c2c]">{h.name}</div>
                                                     <div className="text-xs text-stone-400">{h.region}</div>
                                                 </div>
                                                 <div className="text-xs text-stone-500 mt-1 truncate group-hover:whitespace-normal">{h.description}</div>
                                             </div>
                                         ))}
                                     </div>
                                     <div className="flex gap-2">
                                         <input 
                                            type="text" 
                                            className="border p-2 rounded flex-1 text-sm" 
                                            placeholder="新增堂号..." 
                                            value={newHallName}
                                            onChange={(e) => setNewHallName(e.target.value)}
                                         />
                                         <button onClick={handleAddHall} className="bg-[#5d4037] text-white px-3 rounded text-sm hover:bg-[#4a332a]">添加</button>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400">
                            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p>请选择左侧姓氏进行管理</p>
                        </div>
                    )}
                </div>
            </div>

            {showFormModal && (
                <SurnameFormModal 
                    initialData={editingData} 
                    onClose={() => setShowFormModal(false)}
                    onSave={handleSaveSurname}
                />
            )}
        </div>
    );
};

const RegionManager = ({ regions, setRegions, onBack }: { regions: Region[], setRegions: any, onBack: () => void }) => {
    const [newName, setNewName] = useState("");
    const [newProvince, setNewProvince] = useState("");
    
    const addRegion = () => {
        if(newName && newProvince) {
            setRegions((prev: Region[]) => [...prev, { id: Date.now().toString(), name: newName, province: newProvince }]);
            setNewName("");
            setNewProvince("");
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f1ea] animate-in fade-in">
             <header className="bg-[#2c2c2c] text-white p-4 flex items-center gap-4 sticky top-0">
                <button onClick={onBack}><ArrowRight className="w-6 h-6 rotate-180" /></button>
                <h2 className="text-xl font-bold">地区管理 (Region Manager)</h2>
            </header>
            <div className="container mx-auto p-8 max-w-4xl">
                <div className="bg-white p-6 rounded shadow mb-8">
                    <h3 className="font-bold text-lg mb-4">添加新地区</h3>
                    <div className="flex gap-4">
                        <input className="border p-2 rounded flex-1" placeholder="地区名称 (如: 陇西)" value={newName} onChange={e => setNewName(e.target.value)} />
                        <input className="border p-2 rounded flex-1" placeholder="所属省份 (如: 甘肃)" value={newProvince} onChange={e => setNewProvince(e.target.value)} />
                        <button onClick={addRegion} className="bg-[#8b0000] text-white px-6 rounded hover:bg-red-900">添加</button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {regions.map(r => (
                        <div key={r.id} className="bg-white p-4 rounded border shadow-sm flex justify-between items-center">
                            <div>
                                <div className="font-bold">{r.name}</div>
                                <div className="text-xs text-stone-500">{r.province}</div>
                            </div>
                            <MapIcon className="text-stone-300 w-5 h-5" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
};

const CreateFamilyModal = ({ 
    surnames, regions, onClose, onCreate 
}: { 
    surnames: SurnameData[], regions: Region[], onClose: () => void, onCreate: (f: Family) => void 
}) => {
    const [surnameChar, setSurnameChar] = useState("");
    const [hallName, setHallName] = useState("");
    const [originName, setOriginName] = useState("");
    const [ancestorName, setAncestorName] = useState("");

    // Search state for surnames
    const [surnameSearch, setSurnameSearch] = useState("");

    const filteredSurnames = useMemo(() => {
        return surnames.filter(s => 
            s.character.includes(surnameSearch) || 
            (s.pinyin && s.pinyin.toLowerCase().includes(surnameSearch.toLowerCase()))
        );
    }, [surnames, surnameSearch]);

    const availableHalls = useMemo(() => {
        return surnames.find(s => s.character === surnameChar)?.halls || [];
    }, [surnameChar, surnames]);

    const handleCreate = () => {
        if (!surnameChar || !hallName || !ancestorName) return;
        const newFamily: Family = {
            id: Date.now().toString(),
            createdAt: Date.now(),
            members: [],
            events: [],
            info: {
                surname: surnameChar,
                hallName: hallName,
                origin: originName,
                ancestor: ancestorName,
                motto: "暂无族训",
                generationPoem: "暂无字辈"
            }
        };
        // Add root ancestor as first member
        newFamily.members.push({
            id: "root",
            surname: surnameChar,
            givenName: ancestorName,
            generation: 1,
            generationName: "始",
            gender: Gender.Male,
            birthYear: 0,
            spouses: [],
            children: [],
            location: { name: originName, province: "" }
        });
        
        onCreate(newFamily);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded shadow-2xl overflow-hidden">
                <div className="bg-[#2c2c2c] text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">创建新家族 (Create Family)</h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[#5d4037] mb-1">选择姓氏 (Surname)</label>
                        <div className="relative mb-2">
                             <Search className="absolute left-2 top-2.5 w-4 h-4 text-stone-400" />
                             <input 
                                 className="w-full pl-8 pr-2 py-2 border rounded text-sm bg-stone-50 focus:bg-white transition-colors"
                                 placeholder="搜索姓氏拼音或汉字..."
                                 value={surnameSearch}
                                 onChange={e => setSurnameSearch(e.target.value)}
                             />
                        </div>
                        <select 
                            className="w-full border p-2 rounded max-h-40" 
                            value={surnameChar} 
                            onChange={e => setSurnameChar(e.target.value)}
                            size={6} 
                        >
                            {!surnameChar && <option value="">-- 请从列表选择 --</option>}
                            {filteredSurnames.map(s => <option key={s.character} value={s.character}>{s.character} ({s.pinyin})</option>)}
                            {filteredSurnames.length === 0 && <option disabled>无匹配结果</option>}
                        </select>
                        <p className="text-xs text-stone-400 mt-1">姓氏必须先在姓氏库中存在。如未找到，请先去平台功能中添加。</p>
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-[#5d4037] mb-1">选择堂号 (Hall)</label>
                         <select className="w-full border p-2 rounded" value={hallName} onChange={e => setHallName(e.target.value)} disabled={!surnameChar}>
                            <option value="">-- 请选择 --</option>
                            {availableHalls.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-[#5d4037] mb-1">发源地 (Origin Region)</label>
                         <select className="w-full border p-2 rounded" value={originName} onChange={e => setOriginName(e.target.value)}>
                            <option value="">-- 请选择 --</option>
                            {regions.map(r => <option key={r.id} value={r.name}>{r.name} ({r.province})</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-[#5d4037] mb-1">始祖名讳 (Ancestor Name)</label>
                         <input className="w-full border p-2 rounded" placeholder="如: 利贞" value={ancestorName} onChange={e => setAncestorName(e.target.value)} />
                    </div>
                </div>
                <div className="p-4 bg-stone-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-200 rounded">取消</button>
                    <button onClick={handleCreate} disabled={!surnameChar || !hallName} className="px-4 py-2 bg-[#8b0000] text-white rounded hover:bg-red-900 disabled:opacity-50">创建</button>
                </div>
            </div>
        </div>
    );
};

// --- Extracted Components for Rules of Hooks Compliance ---

const MemberDetailModal = ({ member, onClose }: { member: Person, onClose: () => void }) => {
    const [aiBio, setAiBio] = useState("");

    // Reset bio when member changes (though this component is usually unmounted/remounted)
    useEffect(() => {
        setAiBio("");
    }, [member.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-[#f4f1ea] w-full max-w-2xl rounded shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 p-2"><X className="w-6 h-6" /></button>
                <div className="bg-[#2c2c2c] text-[#f4f1ea] p-8 text-center relative">
                    <h2 className="text-3xl font-serif font-bold">{member.surname}{member.givenName}</h2>
                </div>
                <div className="p-8">
                    <p className="mb-4">{member.biography || "暂无传记"}</p>
                    <button onClick={async () => {
                        try {
                            if(process.env.API_KEY) {
                                const t = await generateBiography(member);
                                setAiBio(t || "");
                            } else {
                                setAiBio("AI Key needed for generation.");
                            }
                        } catch(e){}
                    }} className="text-[#8b0000] text-sm flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Generate Bio</button>
                    {aiBio && <p className="mt-2 text-stone-500 italic border-t pt-2">{aiBio}</p>}
                </div>
            </div>
        </div>
    );
};

const FamilyApp = ({ 
    family, 
    allFamilies,
    onExit, 
    onUpdateFamily 
}: { 
    family: Family, 
    allFamilies: Family[],
    onExit: () => void,
    onUpdateFamily: (f: Family) => void
}) => {
    const [familyPage, setFamilyPage] = useState('home');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState<Person | undefined>(undefined);

    const selectedMember = family.members.find(m => m.id === selectedMemberId);

    const handleAddMember = () => {
        setEditingMember(undefined);
        setShowMemberModal(true);
    };

    const handleEditMember = (member: Person) => {
        setEditingMember(member);
        setShowMemberModal(true);
    };

    const handleDeleteMember = (id: string) => {
        if (!window.confirm("确定要删除该成员吗？这将同时删除其所有后代记录。")) return;
        
        let members = [...family.members];
        const memberToDelete = members.find(m => m.id === id);
        if (!memberToDelete) return;

        // Recursive deletion function
        const deleteRecursive = (targetId: string, list: Person[]) => {
            const target = list.find(m => m.id === targetId);
            if (!target) return list;
            
            // Filter out target
            let newList = list.filter(m => m.id !== targetId);
            
            // Also recursively delete children
            if (target.children && target.children.length > 0) {
                 target.children.forEach(childId => {
                     newList = deleteRecursive(childId, newList);
                 });
            }
            return newList;
        };

        const updatedMembersList = deleteRecursive(id, members);
        
        // Remove from father's children list
        const finalMembers = updatedMembersList.map(m => {
            if (m.children && m.children.includes(id)) {
                return { ...m, children: m.children.filter(cId => cId !== id) };
            }
            return m;
        });

        onUpdateFamily({ ...family, members: finalMembers });
    };

    const handleSaveMember = (memberData: Person) => {
        let updatedMembers = [...family.members];
        
        // Check if editing or adding
        const isNew = !family.members.find(m => m.id === memberData.id);

        if (isNew) {
            updatedMembers.push(memberData);
            // Link to father
            if (memberData.fatherId) {
                 updatedMembers = updatedMembers.map(m => {
                     if (m.id === memberData.fatherId) {
                         return { ...m, children: [...(m.children || []), memberData.id] };
                     }
                     return m;
                 });
            }
        } else {
            // Editing - Replace member data
            updatedMembers = updatedMembers.map(m => m.id === memberData.id ? memberData : m);
            
            // Check if father changed (Simplified: Remove from old father not fully implemented in this quick logic, 
            // but adding to new father is important if fatherId was newly set)
            if (memberData.fatherId) {
                // Ensure linked in father
                const father = updatedMembers.find(f => f.id === memberData.fatherId);
                if (father && (!father.children || !father.children.includes(memberData.id))) {
                     updatedMembers = updatedMembers.map(m => {
                         if (m.id === memberData.fatherId) {
                             return { ...m, children: [...(m.children || []), memberData.id] };
                         }
                         return m;
                     });
                }
            }
        }
        
        onUpdateFamily({ ...family, members: updatedMembers });
        setShowMemberModal(false);
    };

    return (
        <div className="min-h-screen flex flex-col font-serif">
            <header className="bg-[#2c2c2c] text-[#e8e4d9] shadow-lg z-40 sticky top-0">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                     <div className="flex items-center gap-3 cursor-pointer" onClick={() => setFamilyPage('home')}>
                        <div className="w-8 h-8 bg-[#8b0000] rounded-sm flex items-center justify-center font-calligraphy text-white">{family.info.surname}</div>
                        <span className="text-xl font-bold tracking-widest hidden sm:block">传承 · {family.info.surname}氏</span>
                    </div>
                    <nav className="flex gap-4">
                        {['home', 'tree', 'members', 'relationship', 'history'].map(p => (
                            <button key={p} onClick={() => setFamilyPage(p)} className={`${familyPage === p ? 'text-white font-bold' : 'text-stone-400'}`}>
                                {p === 'home' ? '首页' : p === 'tree' ? '族谱' : p === 'members' ? '成员' : p === 'relationship' ? '关系' : '史记'}
                            </button>
                        ))}
                        <div className="w-px h-6 bg-stone-600 mx-2"></div>
                        <button onClick={onExit} className="text-stone-400 hover:text-white flex items-center gap-1">
                            <LogOut className="w-4 h-4" /> 退出
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-grow bg-[#f4f1ea]">
                {familyPage === 'home' && <FamilyHome family={family} onNavigate={setFamilyPage} />}
                {familyPage === 'tree' && <FamilyTree family={family} onSelectMember={(m) => setSelectedMemberId(m.id)} />}
                {familyPage === 'members' && (
                    <FamilyMembers 
                        family={family} 
                        onSelectMember={(m) => setSelectedMemberId(m.id)}
                        onAdd={handleAddMember}
                        onEdit={handleEditMember}
                        onDelete={handleDeleteMember}
                    />
                )}
                {familyPage === 'relationship' && <RelationshipPage family={family} />}
                {familyPage === 'history' && <HistoryPage family={family} />}
            </main>

            {selectedMember && <MemberDetailModal member={selectedMember} onClose={() => setSelectedMemberId(null)} />}
            
            {showMemberModal && (
                <MemberFormModal 
                    initialData={editingMember}
                    allMembers={family.members}
                    allFamilies={allFamilies}
                    onClose={() => setShowMemberModal(false)}
                    onSave={handleSaveMember}
                />
            )}
        </div>
    );
};

// --- Main App Component (Controller) ---

const App = () => {
    // Platform Data State
    const [surnames, setSurnames] = useState<SurnameData[]>(MOCK_SURNAMES);
    const [regions, setRegions] = useState<Region[]>([
        { id: "1", name: "陇西", province: "甘肃" }, 
        { id: "2", name: "太原", province: "山西" },
        { id: "3", name: "绍兴", province: "浙江" },
        { id: "4", name: "颖川", province: "河南" },
        { id: "5", name: "清河", province: "河北" },
        { id: "6", name: "彭城", province: "江苏" },
        { id: "7", name: "琅琊", province: "山东" },
        { id: "8", name: "弘农", province: "河南" },
        { id: "9", name: "江夏", province: "湖北" },
        { id: "10", name: "天水", province: "甘肃" },
        { id: "11", name: "京兆", province: "陕西" },
        { id: "12", name: "陈留", province: "河南" }
    ]);
    const [families, setFamilies] = useState<Family[]>(() => {
        return MOCK_SURNAMES.slice(0, 10).map((s, index) => {
             // 1. Special case for Li (Demo Data)
             if (s.character === '李') {
                 return {
                    id: "default-li",
                    createdAt: Date.now(),
                    info: CLAN_INFO,
                    members: MOCK_MEMBERS,
                    events: EVENTS
                 };
             }

             // 2. Generic case for others
             const hall = s.halls[0] || { name: `${s.character}氏宗祠`, region: "中原", description: "历史悠久" };
             const ancestorRaw = s.famousAncestors?.[0] || "始祖";
             // Extract name parts: Remove surname if present at start, handle "(Title)"
             let cleanName = ancestorRaw.split('(')[0].trim();
             let givenName = cleanName;
             if (cleanName.startsWith(s.character) && cleanName.length > 1) {
                 givenName = cleanName.substring(s.character.length);
             } else if (cleanName === s.character) {
                 givenName = "公"; // Fallback if just surname listed
             }

             return {
                 id: `default-${s.pinyin.toLowerCase()}`,
                 createdAt: Date.now() - (index * 86400000), // Previous days
                 info: {
                     surname: s.character,
                     hallName: hall.name,
                     origin: hall.region || "中原",
                     ancestor: cleanName,
                     motto: "遵纪守法，尊祖敬宗，勤俭持家，和睦乡邻。", // Generic Motto
                     generationPoem: "福禄寿喜，世代荣昌，祖德流芳，万古长青。" // Generic Poem
                 },
                 members: [
                     {
                         id: `root-${s.pinyin}`,
                         surname: s.character,
                         givenName: givenName,
                         generation: 1,
                         generationName: "始",
                         gender: Gender.Male,
                         birthYear: -200 + (index * 50), // Rough historical times
                         spouses: [],
                         children: [],
                         location: { name: hall.region || "中原", province: hall.region || "中原" },
                         biography: `${s.character}姓始祖，${s.origin.substring(0, 50)}...`
                     }
                 ],
                 events: [
                     { 
                         year: 1, 
                         title: "家族起源", 
                         description: `${s.character}姓起源于${s.origin.substring(0, 10)}...`, 
                         type: "BIRTH" 
                     }
                 ]
             };
        });
    });

    // UI State
    const [view, setView] = useState<'PORTAL' | 'SURNAME_MGR' | 'REGION_MGR' | 'FAMILY_APP' | 'GLOBAL_RELATIONSHIP'>('PORTAL');
    const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Derived
    const activeFamily = families.find(f => f.id === activeFamilyId);

    // Handlers
    const handleCreateFamily = (newFamily: Family) => {
        setFamilies(prev => [...prev, newFamily]);
        setShowCreateModal(false);
        setActiveFamilyId(newFamily.id);
        setView('FAMILY_APP');
    };

    const handleSelectFamily = (id: string) => {
        setActiveFamilyId(id);
        setView('FAMILY_APP');
    };

    const handleUpdateFamily = (updatedFamily: Family) => {
        setFamilies(prev => prev.map(f => f.id === updatedFamily.id ? updatedFamily : f));
    };

    // Render Logic
    if (view === 'SURNAME_MGR') {
        return <SurnameManager surnames={surnames} setSurnames={setSurnames} onBack={() => setView('PORTAL')} />;
    }

    if (view === 'REGION_MGR') {
        return <RegionManager regions={regions} setRegions={setRegions} onBack={() => setView('PORTAL')} />;
    }

    if (view === 'GLOBAL_RELATIONSHIP') {
        return <GlobalRelationshipPage families={families} onBack={() => setView('PORTAL')} />;
    }

    if (view === 'FAMILY_APP' && activeFamily) {
        return <FamilyApp family={activeFamily} allFamilies={families} onExit={() => setView('PORTAL')} onUpdateFamily={handleUpdateFamily} />;
    }

    // Default: Portal View
    return (
        <>
            <PortalHome 
                surnames={surnames} 
                regions={regions} 
                families={families}
                onManageSurnames={() => setView('SURNAME_MGR')}
                onManageRegions={() => setView('REGION_MGR')}
                onSelectFamily={handleSelectFamily}
                onCreateFamily={() => setShowCreateModal(true)}
                onGlobalRelationship={() => setView('GLOBAL_RELATIONSHIP')}
            />
            {showCreateModal && (
                <CreateFamilyModal 
                    surnames={surnames} 
                    regions={regions} 
                    onClose={() => setShowCreateModal(false)} 
                    onCreate={handleCreateFamily} 
                />
            )}
        </>
    );
};

export default App;