function getAllNotes() {
    const note = JSON.parse(localStorage.getItem("notesapp-notes") || "[]");
    return note.sort((a, b) => {
        return new Date(a.updated) > new Date(b.updated) ? -1 : 1;
    });
}

function saveNote(noteToSave) {
    const notes = getAllNotes();

    const existing = notes.find((note) => note.id === noteToSave.id)
    //EIDT OR UPDATED
    if (existing) {
        existing.title = noteToSave.title;
        existing.body = noteToSave.body;
        existing.updated = new Date().toISOString();
    } else {
        noteToSave.id = Math.floor(Math.random() * 1000000);
        noteToSave.updated = new Date().toISOString();
        notes.push(noteToSave);
    }

    localStorage.setItem("notesapp-notes", JSON.stringify(notes));
}

function deleteNote(id) {
    const notes = getAllNotes();
    const newNote = notes.filter((note) => note.id != id);
    localStorage.setItem("notesapp-notes", JSON.stringify(newNote));
}

class NoteView {
    constructor(root, { onNoteSelect, onNoteAdd, onNoteDelete, onNoteEdit } = {}) {
        this.root = root;
        this.onNoteSelect = onNoteSelect;
        this.onNoteAdd = onNoteAdd;
        this.onNoteDelete = onNoteDelete;
        this.onNoteEdit = onNoteEdit;
        this.root.innerHTML = `
             <div class="nav bg-white">
                <button class="nav-box bg-red notes__del"></button>
                <button class="nav-box bg-yellow toggle-btn"></button>
                <button class="nav-box bg-green notes__add"></button>
            </div>
            <div class="notes bg-white" >
                <div class="notes__sidebar " id="sidebar">
                    <div class="notes__list">
                        <div class="notes__list-item">
                        </div>
                    </div>
                </div>
                <div class="notes__preview">
                    <input type="text" class="notes__title" placeholder="New Note...">
                    <textarea class="notes__body">Take Note...</textarea>
                </div>
            </div>
        `;

        this.btnAdd = this.root.querySelector(".notes__add");
        this.btnDel = this.root.querySelector(".notes__del");
        this.inpTitle = this.root.querySelector(".notes__title");
        this.inpBody = this.root.querySelector(".notes__body");

        this.btnAdd.addEventListener("click", () => {
            this.onNoteAdd();
        });

        [this.inpTitle, this.inpBody].forEach(inpField => {
            inpField.addEventListener("blur", () => {
                const updatedTitle = this.inpTitle.value.trim();
                const updatedBody = this.inpBody.value.trim();

                this.onNoteEdit(updatedTitle, updatedBody);
            });
        });

        this.updateNotePreivewVisibility(false);

    }


    _createNoteListItemHTML(id, title, body, updated) {
        const MAX_BODY_LENGTH = 60;
        return `
            <div class="notes__list-item" data-note-id="${id}">
                <div class="notes__small-title">${title}</div>
                <div class="notes__small-body">
                    ${body.substring(0, MAX_BODY_LENGTH)}
                    ${body.length > MAX_BODY_LENGTH ? "..." : ""}
                </div>
                <div class="notes__small-updated">
                    ${updated.toLocaleString('en-GB', { dateStyle: "full", timeStyle: "short" })}
                </div>
            </div>
        `;
    }

    updateNoteList(notes) {
        const noteListContainer = this.root.querySelector(".notes__list");

        // CREATE AN EMPTY FIRST THEN UPDATING
        noteListContainer.innerHTML = "";

        for (const note of notes) {
            const html = this._createNoteListItemHTML(note.id, note.title, note.body, new Date(note.updated));

            noteListContainer.insertAdjacentHTML("beforeend", html);
        }

        // SELECT THE LIST 
        noteListContainer.querySelectorAll(".notes__list-item").forEach(noteItem => {
            noteItem.addEventListener("click", () => {
                this.onNoteSelect(noteItem.dataset.noteId);
            });

        });

        // DELETE THE SELECTED LIST
        this.btnDel.addEventListener("click", () => {
            const selectedNoteId = this.root.querySelector(".notes__list-item--selected")?.dataset.noteId;
            if (selectedNoteId) {
                const doDelete = confirm("Are you sure you want to delete this note?");
                if (doDelete) {
                    this.onNoteDelete(selectedNoteId);
                }
            }
        });
    }

    updateActiveNote(note) {
        this.root.querySelector(".notes__title").value = note.title;
        this.root.querySelector(".notes__body").value = note.body;

        this.root.querySelectorAll(".notes__list-item").forEach(item => {
            item.classList.remove("notes__list-item--selected")
        });
        this.root.querySelector(`.notes__list-item[data-note-id="${note.id}"]`).classList.add("notes__list-item--selected");
    }

    updateNotePreivewVisibility(visible) {
        this.root.querySelector('.notes__preview').style.visibility = visible ? "visible" : "hidden";
    }
}

// TOOGLE SIDE BAR
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.querySelector('.toggle-btn');
    const sidebar = document.getElementById('sidebar');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
});
class App {
    constructor(root) {
        this.notes = [];
        this.activeNote = null;
        this.view = new NoteView(root, this._handlers());

        this._refreshNotes();
    }

    _refreshNotes() {
        const notes = getAllNotes();
        this._setNotes(notes);

        if (notes.length > 0) {
            this._setActiveNotes(notes[0]);
        }
    }

    _setNotes(notes) {
        this.notes = notes;
        this.view.updateNoteList(notes);
        this.view.updateNotePreivewVisibility(notes.length > 0);
    }

    _setActiveNotes(note) {
        this.activeNote = note;
        this.view.updateActiveNote(note);
    }

    _handlers() {
        return {
            onNoteSelect: noteId => {
                const selectedNote = this.notes.find(note => note.id == noteId);
                this._setActiveNotes(selectedNote);
            },
            onNoteAdd: () => {
                const newNote = {
                    title : "New Note",
                    body : "Take note..."
                }
                saveNote(newNote);
                this._refreshNotes();
            },
            onNoteDelete: noteId => {
                deleteNote(noteId);
                this._refreshNotes();
            },
            onNoteEdit: (newTitle, newbody) => {
                saveNote({
                    id : this.activeNote.id,
                    title : newTitle,
                    body : newbody
                })
                this._refreshNotes();
            },
        };
    }
}

const root = document.getElementById("app");
const app = new App(root)
