import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

//{i18n.t("")}

const translations = {
  en: {
    welcome: "Welcome",
    calculate: "Calculate",
    glazes: "Glazes",
    rawMaterials: "Raw Materials",
    addMat: "Recipe is empty. Add raw materials.",
    amount: "Amount %",
    plusMat: "+ Add raw material",
    calculatedSeger: "Calculated Seger Formula",
    addMatForSeger: "Add raw materials and amounts to see the Seger formula.",
    targetSeger: "Target Seger Formula",
    instructionsSeger:
      "The sum of RO+R₂O is automatically normalized to 1. Enter ratios (e.g., Ca=0.5, Na=0.3, K=0.2).",
    segerGroupSmelter: "RO / R₂O (fluxes)",
    segerGroupStab: "R₂O₃ (stabilizers)",
    segerGroupGlass: "RO₂ (glass formers)",
    Recipe: "Recipe",
    chosenMats: "Selected Raw Materials",
    chosenMatsInstr:
      "Select which raw materials the calculator can use. The more you select, the better the result.",
    matsNotChosen: "No raw materials selected.",
    chooseMats: "+ Select raw materials",
    calcRecipe: "Calculate Recipe",
    calcedRecipe: "Calculated Recipe",
    unknown: "Unknown",
    realizedForm: "Realized Seger Formula.",
    chooseMat: "Select Raw Material",
    cancel: "Cancel",
    ok: "OK",
    delete: "Delete",
    done: "Done",
    chooseMatsToUse: "Select raw materials to use.",
    canChooseMany: "You can select multiple",
    atLeastOneRO: "Enter at least one RO/R₂O value (Ca, Na, K, etc.).",
    calcErr: "Calculation failed",
    RecToSeg: "Recipe -> Seger",
    SegToRec: "Seger -> Recipe",
  },

  fi: {
    welcome: "Tervetuloa",
    calculate: "Laske",
    glazes: "Lasitteet",
    rawMaterials: "Raaka-aineet",
    addMat: "Resepti on tyhjä. Lisää raaka-aineita.",
    amount: "Määrä %",
    plusMat: "+ Lisää raaka-aine",
    calculatedSeger: "Laskettu Seger-kaava",
    addMatForSeger: "Lisää raaka-aineita ja määrät nähdäksesi Seger-kaavan.",
    targetSeger: "Haluttu Seger-kaava",
    instructionsSeger:
      "RO+R₂O summa normitetaan automaattisesti → 1. Syötä suhteet (esim. Ca=0.5, Na=0.3, K=0.2).",
    segerGroupSmelter: "RO / R₂O (sulattajat)",
    segerGroupStab: "R₂O₃ (stabilisaattorit)",
    segerGroupGlass: "RO₂ (lasiglaasit)",
    Recipe: "Resepti",

    chosenMats: "Käytettävät raaka-aineet",
    chosenMatsInstr:
      "Valitse mitkä raaka-aineet laskuri saa käyttää. Mitä enemmän valitset, sitä parempi tulos.",
    matsNotChosen: "Ei raaka-aineita valittu.",
    chooseMats: "+ Valitse raaka-aineet",
    calcRecipe: "Laske resepti",
    calcedRecipe: "Laskettu resepti",
    unknown: "Tuntematon",
    realizedForm: "Toteutunut Seger-kaava.",
    chooseMat: "Valitse raaka-aine",
    cancel: "Peruuta",
    ok: "OK",
    delete: "Poista",
    done: "Valmis",
    chooseMatsToUse: "Valitse käytettävät raaka-aineet.",
    canChooseMany: "Voit valita useita",
    atLeastOneRO: "Syötä ainakin yksi RO/R₂O-arvo (Ca, Na, K jne.).",
    calcErr: "Laskenta epäonnistui",
    RecToSeg: "Resepti -> Seger",
    SegToRec: "Seger -> Resepti",
  },
};

const i18n = new I18n(translations);

// Phone's language if it can be find (otherwise using finnish or english)
const deviceLanguage = getLocales()[0]?.languageCode ?? "fi";
i18n.locale = deviceLanguage;

// Jos halutaan sallia myös puuttuvien käännösten näyttäminen oletuskielenä:
// if want allow to be show missing translates
i18n.enableFallback = true;
i18n.defaultLocale = "fi";

export default i18n;
